import bcrypt
import secrets
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from backend.models import User

# Simple token storage (in production, use JWT or proper session management)
active_tokens = {}  # token -> user_id

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(user_id: int) -> str:
    """Create a simple access token."""
    token = secrets.token_urlsafe(32)
    active_tokens[token] = {
        'user_id': user_id,
        'created_at': datetime.utcnow()
    }
    return token

def get_user_from_token(token: str) -> Optional[int]:
    """Get user ID from token."""
    token_data = active_tokens.get(token)
    if token_data:
        return token_data['user_id']
    return None

def revoke_token(token: str):
    """Revoke a token."""
    if token in active_tokens:
        del active_tokens[token]

def get_current_user(db: Session, token: str) -> Optional[User]:
    """Get current user from token."""
    user_id = get_user_from_token(token)
    if user_id:
        return db.query(User).filter(User.id == user_id).first()
    return None
