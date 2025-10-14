from pydantic import BaseModel, Field, field_serializer, EmailStr
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    user: UserResponse
    token: str  # Simple token for now
    message: str

# Response Scenario Schema
class ResponseScenario(BaseModel):
    name: str  # e.g., "Success", "Rate Limited", "Server Error"
    response_code: int
    response_body: str
    response_headers: Dict[str, str] = {}
    delay_ms: int = 0  # Delay per scenario

# Entity Schemas (renamed from Tenant)
class EntityCreate(BaseModel):
    name: str
    is_public: bool = False  # Default to private

class EntityUpdate(BaseModel):
    name: Optional[str] = None
    is_public: Optional[bool] = None

class EntityResponse(BaseModel):
    id: int
    name: str
    api_key: str
    base_path: str
    owner_id: Optional[int]
    is_public: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class EntityShareRequest(BaseModel):
    user_id: int  # ID of user to share with

# Mock Endpoint Schemas
class MockEndpointCreate(BaseModel):
    name: str
    method: str = Field(..., pattern="^(GET|POST|PUT|DELETE|PATCH)$")
    path: str
    response_body: str
    response_code: int = 200
    response_headers: Optional[Dict[str, str]] = {}
    delay_ms: int = 0
    is_active: bool = True
    response_scenarios: Optional[List[ResponseScenario]] = []
    active_scenario_index: int = 0

class MockEndpointUpdate(BaseModel):
    name: Optional[str] = None
    method: Optional[str] = Field(None, pattern="^(GET|POST|PUT|DELETE|PATCH)$")
    path: Optional[str] = None
    response_body: Optional[str] = None
    response_code: Optional[int] = None
    response_headers: Optional[Dict[str, str]] = None
    delay_ms: Optional[int] = None
    is_active: Optional[bool] = None
    response_scenarios: Optional[List[ResponseScenario]] = None
    active_scenario_index: Optional[int] = None

class MockEndpointResponse(BaseModel):
    id: int
    entity_id: int
    name: str
    method: str
    path: str
    response_body: str
    response_code: int
    response_headers: str
    delay_ms: int
    is_active: bool
    response_scenarios: str  # JSON string
    active_scenario_index: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Request Log Schemas
class RequestLogResponse(BaseModel):
    id: int
    entity_id: int
    mock_endpoint_id: Optional[int]
    method: str
    path: str
    request_headers: str
    request_body: Optional[str]
    query_params: Optional[str]
    response_code: int
    response_body: Optional[str]
    timestamp: datetime
    
    @field_serializer('timestamp')
    def serialize_timestamp(self, dt: datetime, _info):
        # Ensure timestamp is treated as UTC
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()
    
    class Config:
        from_attributes = True
