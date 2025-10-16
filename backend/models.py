from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base
import secrets
import hashlib

# Association table for users and entities (many-to-many)
user_entity_association = Table(
    'user_entity_association',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('entity_id', Integer, ForeignKey('entities.id'))
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Many-to-many relationship with entities
    entities = relationship("Entity", secondary=user_entity_association, back_populates="users")

class Entity(Base):
    __tablename__ = "entities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    api_key = Column(String, unique=True, index=True, default=lambda: secrets.token_urlsafe(32))
    base_path = Column(String, unique=True, index=True)  # e.g., /api/entity123
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Owner of the entity
    is_public = Column(Boolean, default=False)  # Public entities are visible to all
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship with owner
    owner = relationship("User", foreign_keys=[owner_id])
    # Many-to-many relationship with users (for sharing)
    users = relationship("User", secondary=user_entity_association, back_populates="entities")
    mock_endpoints = relationship("MockEndpoint", back_populates="entity", cascade="all, delete-orphan")
    request_logs = relationship("RequestLog", back_populates="entity", cascade="all, delete-orphan")

class MockEndpoint(Base):
    __tablename__ = "mock_endpoints"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(Integer, ForeignKey("entities.id"))
    name = Column(String, index=True)
    method = Column(String)  # GET, POST, PUT, DELETE, PATCH
    path = Column(String)  # e.g., /users/{id}
    response_body = Column(Text)  # JSON string (legacy - kept for backward compatibility)
    response_code = Column(Integer, default=200)  # Legacy - kept for backward compatibility
    response_headers = Column(Text, default="{}")  # JSON string (legacy)
    delay_ms = Column(Integer, default=0)  # Optional delay in milliseconds
    is_active = Column(Boolean, default=True)
    # New fields for multi-response scenarios
    response_scenarios = Column(Text, default="[]")  # JSON array of response configs
    active_scenario_index = Column(Integer, default=0)  # Which scenario is currently active
    # Callback configuration
    callback_enabled = Column(Boolean, default=False)
    callback_url = Column(String, nullable=True)  # Static callback URL
    callback_method = Column(String, default="POST")  # HTTP method for callback
    callback_delay_ms = Column(Integer, default=0)  # Delay before sending callback
    callback_extract_from_request = Column(Boolean, default=False)  # Extract callback URL from request
    callback_extract_field = Column(String, nullable=True)  # JSON path to extract callback URL (e.g., "callbackUrl" or "meta.callback")
    callback_payload = Column(Text, nullable=True)  # Custom callback payload (JSON string, supports placeholders)
    # Schema validation
    request_schema = Column(Text, nullable=True)  # JSON Schema for request validation
    schema_validation_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    entity = relationship("Entity", back_populates="mock_endpoints")
    request_logs = relationship("RequestLog", back_populates="mock_endpoint", cascade="all, delete-orphan")

class RequestLog(Base):
    __tablename__ = "request_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(Integer, ForeignKey("entities.id"))
    mock_endpoint_id = Column(Integer, ForeignKey("mock_endpoints.id"), nullable=True)
    method = Column(String)
    path = Column(String)
    request_headers = Column(Text)  # JSON string
    request_body = Column(Text, nullable=True)
    query_params = Column(Text, nullable=True)  # JSON string
    response_code = Column(Integer)
    response_body = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    entity = relationship("Entity", back_populates="request_logs")
    mock_endpoint = relationship("MockEndpoint", back_populates="request_logs")
