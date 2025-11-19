"""
Session storage abstraction for distributed session management.
Supports Redis (recommended) and database fallback for production deployments.
"""
import os
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Try to import Redis
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not available. Falling back to database storage.")


class SessionStore:
    """Abstract session storage interface."""
    
    def set_token(self, token: str, user_id: int, expires_in_seconds: int = 86400) -> bool:
        """Store a token with expiration. Returns True on success."""
        raise NotImplementedError
    
    def get_token(self, token: str) -> Optional[Dict]:
        """Get token data. Returns dict with 'user_id' and 'created_at' or None."""
        raise NotImplementedError
    
    def delete_token(self, token: str) -> bool:
        """Delete a token. Returns True on success."""
        raise NotImplementedError
    
    def cleanup_expired(self) -> int:
        """Clean up expired tokens. Returns number of tokens cleaned."""
        raise NotImplementedError


class RedisSessionStore(SessionStore):
    """Redis-based session storage (recommended for production)."""
    
    def __init__(self):
        if not REDIS_AVAILABLE:
            raise RuntimeError("Redis is not available")
        
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        try:
            self.client = redis.from_url(redis_url, decode_responses=True)
            # Test connection
            self.client.ping()
            logger.info("✓ Connected to Redis for session storage")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    def set_token(self, token: str, user_id: int, expires_in_seconds: int = 86400) -> bool:
        """Store token in Redis with expiration."""
        try:
            token_data = {
                'user_id': user_id,
                'created_at': datetime.utcnow().isoformat()
            }
            self.client.setex(
                f"session:{token}",
                expires_in_seconds,
                json.dumps(token_data)
            )
            return True
        except Exception as e:
            logger.error(f"Failed to store token in Redis: {e}")
            return False
    
    def get_token(self, token: str) -> Optional[Dict]:
        """Get token data from Redis."""
        try:
            data = self.client.get(f"session:{token}")
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Failed to get token from Redis: {e}")
            return None
    
    def delete_token(self, token: str) -> bool:
        """Delete token from Redis."""
        try:
            self.client.delete(f"session:{token}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete token from Redis: {e}")
            return False
    
    def cleanup_expired(self) -> int:
        """Redis handles expiration automatically, but we can scan for cleanup."""
        # Redis TTL handles expiration automatically, so this is mostly a no-op
        # But we can return 0 to indicate no manual cleanup needed
        return 0


class DatabaseSessionStore(SessionStore):
    """Database-based session storage (default - uses PostgreSQL)."""
    
    def __init__(self, db_session_factory):
        """Initialize with a database session factory."""
        self.db_session_factory = db_session_factory
    
    def set_token(self, token: str, user_id: int, expires_in_seconds: int = 86400) -> bool:
        """Store token in database."""
        from backend.models import SessionToken
        db = self.db_session_factory()
        try:
            expires_at = datetime.utcnow() + timedelta(seconds=expires_in_seconds)
            
            # Check if token already exists
            existing = db.query(SessionToken).filter(SessionToken.token == token).first()
            if existing:
                existing.user_id = user_id
                existing.created_at = datetime.utcnow()
                existing.expires_at = expires_at
            else:
                session_token = SessionToken(
                    token=token,
                    user_id=user_id,
                    created_at=datetime.utcnow(),
                    expires_at=expires_at
                )
                db.add(session_token)
            
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to store token in database: {e}")
            db.rollback()
            return False
        finally:
            db.close()
    
    def get_token(self, token: str) -> Optional[Dict]:
        """Get token data from database."""
        from backend.models import SessionToken
        db = self.db_session_factory()
        try:
            session_token = db.query(SessionToken).filter(
                SessionToken.token == token,
                SessionToken.expires_at > datetime.utcnow()
            ).first()
            
            if session_token:
                return {
                    'user_id': session_token.user_id,
                    'created_at': session_token.created_at.isoformat()
                }
            return None
        except Exception as e:
            logger.error(f"Failed to get token from database: {e}")
            return None
        finally:
            db.close()
    
    def delete_token(self, token: str) -> bool:
        """Delete token from database."""
        from backend.models import SessionToken
        db = self.db_session_factory()
        try:
            session_token = db.query(SessionToken).filter(SessionToken.token == token).first()
            if session_token:
                db.delete(session_token)
                db.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to delete token from database: {e}")
            db.rollback()
            return False
        finally:
            db.close()
    
    def cleanup_expired(self) -> int:
        """Clean up expired tokens from database."""
        from backend.models import SessionToken
        db = self.db_session_factory()
        try:
            count = db.query(SessionToken).filter(
                SessionToken.expires_at <= datetime.utcnow()
            ).delete()
            db.commit()
            if count > 0:
                logger.info(f"Cleaned up {count} expired session tokens")
            return count
        except Exception as e:
            logger.error(f"Failed to cleanup expired tokens: {e}")
            db.rollback()
            return 0
        finally:
            db.close()


# Global session store instance
_session_store: Optional[SessionStore] = None


def get_session_store(db_session_factory=None) -> SessionStore:
    """Get or create the global session store instance.
    
    Defaults to database storage. Uses Redis only if REDIS_URL is explicitly set.
    """
    global _session_store
    
    if _session_store is not None:
        return _session_store
    
    # Use Redis only if explicitly configured via REDIS_URL
    redis_url = os.getenv("REDIS_URL")
    if REDIS_AVAILABLE and redis_url:
        try:
            _session_store = RedisSessionStore()
            logger.info("Using Redis for session storage (REDIS_URL is set)")
            return _session_store
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Falling back to database storage.")
    
    # Default: Use database storage (PostgreSQL)
    if db_session_factory is None:
        from backend.database import SessionLocal
        db_session_factory = SessionLocal
    
    _session_store = DatabaseSessionStore(db_session_factory)
    logger.info("Using PostgreSQL database for session storage (default)")
    return _session_store


def initialize_session_store(db_session_factory=None):
    """Initialize the session store. Call this at application startup."""
    store = get_session_store(db_session_factory)
    logger.info(f"Session store initialized: {type(store).__name__}")
    return store

