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
    is_admin: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    user: UserResponse
    token: str  # Simple token for now
    message: str

# Password Reset Schemas
class PasswordResetInitiateResponse(BaseModel):
    user_id: int
    reset_token: str
    expires_at: datetime

class PasswordResetCompleteRequest(BaseModel):
    token: str
    new_password: str

# Admin User Role Schemas
class AdminRoleUpdateResponse(BaseModel):
    user_id: int
    is_admin: bool

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
    scenario_selection_mode: str = "fixed"  # fixed | random | weighted
    scenario_weights: Optional[List[float]] = None
    # Callback configuration
    callback_enabled: bool = False
    callback_url: Optional[str] = None
    callback_method: str = "POST"
    callback_delay_ms: int = 0
    callback_extract_from_request: bool = False
    callback_extract_field: Optional[str] = None
    callback_payload: Optional[str] = None  # Custom callback payload (JSON string)
    # Schema validation
    request_schema: Optional[str] = None  # JSON Schema as string
    schema_validation_enabled: bool = False

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
    scenario_selection_mode: Optional[str] = None
    scenario_weights: Optional[List[float]] = None
    # Callback configuration
    callback_enabled: Optional[bool] = None
    callback_url: Optional[str] = None
    callback_method: Optional[str] = None
    callback_delay_ms: Optional[int] = None
    callback_extract_from_request: Optional[bool] = None
    callback_extract_field: Optional[str] = None
    callback_payload: Optional[str] = None
    # Schema validation
    request_schema: Optional[str] = None
    schema_validation_enabled: Optional[bool] = None

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
    scenario_selection_mode: str
    scenario_weights: Optional[str]
    callback_enabled: bool
    callback_url: Optional[str]
    callback_method: str
    callback_delay_ms: int
    callback_extract_from_request: bool
    callback_extract_field: Optional[str]
    callback_payload: Optional[str]
    request_schema: Optional[str]
    schema_validation_enabled: bool
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

# Admin Dashboard Schemas
class UserStatsResponse(BaseModel):
    id: int
    email: str
    username: str
    is_admin: bool
    created_at: datetime
    collections_owned: int
    collections_shared: int
    total_endpoints: int
    total_requests: int
    
    class Config:
        from_attributes = True

class CollectionStatsResponse(BaseModel):
    id: int
    name: str
    base_path: str
    owner_username: str
    is_public: bool
    created_at: datetime
    endpoint_count: int
    request_count: int
    last_request_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class DashboardStatsResponse(BaseModel):
    total_users: int
    total_collections: int
    total_endpoints: int
    total_requests: int
    public_collections: int
    private_collections: int
    admin_users: int
    requests_today: int
    requests_this_week: int
