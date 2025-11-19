import bcrypt
import secrets
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from backend.models import User
from backend.session_store import get_session_store

# Token expiration time (24 hours)
TOKEN_EXPIRATION_SECONDS = 86400

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(user_id: int) -> str:
    """Create an access token and store it in shared session storage."""
    token = secrets.token_urlsafe(32)
    session_store = get_session_store()
    session_store.set_token(token, user_id, expires_in_seconds=TOKEN_EXPIRATION_SECONDS)
    return token

def get_user_from_token(token: str) -> Optional[int]:
    """Get user ID from token using shared session storage."""
    session_store = get_session_store()
    token_data = session_store.get_token(token)
    if token_data:
        return token_data['user_id']
    return None

def revoke_token(token: str):
    """Revoke a token from shared session storage."""
    session_store = get_session_store()
    session_store.delete_token(token)

def get_current_user(db: Session, token: str) -> Optional[User]:
    """Get current user from token."""
    user_id = get_user_from_token(token)
    if user_id:
        return db.query(User).filter(User.id == user_id).first()
    return None
