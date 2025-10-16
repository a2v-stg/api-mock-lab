from fastapi import FastAPI, Depends, HTTPException, Request, Response, WebSocket, WebSocketDisconnect, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Set
import json
import asyncio
import re
from datetime import datetime, timezone

from backend.database import engine, get_db, Base
from backend.models import User, Entity, MockEndpoint, RequestLog
from backend.schemas import (
    UserCreate, UserLogin, UserResponse, LoginResponse,
    EntityCreate, EntityUpdate, EntityResponse, EntityShareRequest,
    MockEndpointCreate, MockEndpointUpdate, MockEndpointResponse,
    RequestLogResponse,
    UserStatsResponse, CollectionStatsResponse, DashboardStatsResponse
)
from backend.auth import hash_password, verify_password, create_access_token, get_current_user
from backend.migrations import run_migrations
from backend.placeholders import replace_placeholders
from backend.schema_validator import validate_request as validate_schema, is_valid_schema
from backend.callbacks import schedule_callback, extract_callback_url
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Run migrations first (before create_all)
try:
    run_migrations(engine)
except Exception as e:
    logger.error(f"Migration failed: {e}")
    # Continue anyway for new installations

# Create database tables (for new installations or missing tables)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mock-Lab",
    description="Dynamic API mocking service with real-time monitoring and scenario-based testing",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== WebSocket Manager ====================

class ConnectionManager:
    def __init__(self):
        # entity_id -> Set of WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, entity_id: int):
        await websocket.accept()
        if entity_id not in self.active_connections:
            self.active_connections[entity_id] = set()
        self.active_connections[entity_id].add(websocket)

    def disconnect(self, websocket: WebSocket, entity_id: int):
        if entity_id in self.active_connections:
            self.active_connections[entity_id].discard(websocket)
            if not self.active_connections[entity_id]:
                del self.active_connections[entity_id]

    async def broadcast_to_entity(self, entity_id: int, message: dict):
        if entity_id in self.active_connections:
            dead_connections = set()
            for connection in self.active_connections[entity_id]:
                try:
                    await connection.send_json(message)
                except:
                    dead_connections.add(connection)
            
            # Clean up dead connections
            for connection in dead_connections:
                self.active_connections[entity_id].discard(connection)

manager = ConnectionManager()

# ==================== Authentication Dependencies ====================

async def get_current_user_dependency(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to get current authenticated user from Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization token")
    
    # Extract token from "Bearer <token>" format
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = parts[1]
    user = get_current_user(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return user

async def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Dependency to optionally get current user (doesn't raise if not authenticated)."""
    if not authorization:
        return None
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    token = parts[1]
    return get_current_user(db, token)

def check_entity_access(user: User, entity: Entity) -> bool:
    """Check if user has access to an entity."""
    # Public entities are accessible to everyone
    if entity.is_public:
        return True
    
    # Owner has access
    if entity.owner_id == user.id:
        return True
    
    # Check if entity is shared with user
    if user in entity.users:
        return True
    
    return False

def require_entity_access(user: User, entity: Entity):
    """Raise HTTPException if user doesn't have access to entity."""
    if not check_entity_access(user, entity):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to access this entity"
        )

def require_entity_ownership(user: User, entity: Entity):
    """Raise HTTPException if user is not the owner of the entity."""
    if entity.owner_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the entity owner can perform this action"
        )

async def get_admin_user(
    current_user: User = Depends(get_current_user_dependency)
) -> User:
    """Dependency to ensure current user is an admin."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return current_user

# ==================== Authentication ====================

@app.post("/auth/register", response_model=UserResponse, tags=["Auth"])
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user.email) | (User.username == user.username)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create new user
    hashed_pwd = hash_password(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_pwd
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/auth/login", response_model=LoginResponse, tags=["Auth"])
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and get access token."""
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(user.id)
    
    return LoginResponse(
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            created_at=user.created_at,
            is_admin=user.is_admin,
        ),
        token=token,
        message="Login successful"
    )

@app.get("/auth/me", response_model=UserResponse, tags=["Auth"])
def get_current_user_info(token: str, db: Session = Depends(get_db)):
    """Get current user information."""
    user = get_current_user(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user

@app.get("/users", response_model=List[UserResponse], tags=["Users"])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """List all users. Requires authentication. Used for sharing entities."""
    users = db.query(User).all()
    return users

# ==================== Entity Management ====================

@app.post("/admin/entities", response_model=EntityResponse, tags=["Admin"])
def create_entity(
    entity: EntityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Create a new entity with a unique base path and API key. Requires authentication."""
    # Generate unique base path from name
    base_path = f"/api/{entity.name.lower().replace(' ', '-')}"
    
    # Check if entity name or base path already exists
    existing = db.query(Entity).filter(
        (Entity.name == entity.name) | (Entity.base_path == base_path)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Entity name already exists")
    
    # Create entity with owner
    db_entity = Entity(
        name=entity.name,
        base_path=base_path,
        owner_id=current_user.id,
        is_public=entity.is_public
    )
    db.add(db_entity)
    db.commit()
    db.refresh(db_entity)
    return db_entity

@app.get("/admin/entities", response_model=List[EntityResponse], tags=["Admin"])
def list_entities(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """List entities accessible to the current user (owned, shared, and public)."""
    if not current_user:
        # If not authenticated, only show public entities
        return db.query(Entity).filter(Entity.is_public == True).all()
    
    # Get entities where user is owner
    owned_entities = db.query(Entity).filter(Entity.owner_id == current_user.id).all()
    
    # Get public entities not owned by user
    public_entities = db.query(Entity).filter(
        Entity.is_public == True,
        Entity.owner_id != current_user.id
    ).all()
    
    # Get entities shared with user (from many-to-many relationship)
    shared_entities = [e for e in current_user.entities if e.owner_id != current_user.id and not e.is_public]
    
    # Combine and deduplicate
    all_entities = owned_entities + public_entities + shared_entities
    return all_entities

@app.get("/admin/entities/{entity_id}", response_model=EntityResponse, tags=["Admin"])
def get_entity(
    entity_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get a specific entity if user has access."""
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Check access permissions
    if current_user:
        if not check_entity_access(current_user, entity):
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        # Not authenticated - can only view public entities
        if not entity.is_public:
            raise HTTPException(status_code=401, detail="Authentication required")
    
    return entity

@app.delete("/admin/entities/{entity_id}", tags=["Admin"])
def delete_entity(
    entity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Delete an entity and all associated mock endpoints and logs. Only owner can delete."""
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Only owner can delete
    require_entity_ownership(current_user, entity)
    
    db.delete(entity)
    db.commit()
    return {"message": "Entity deleted successfully"}

@app.put("/admin/entities/{entity_id}", response_model=EntityResponse, tags=["Admin"])
def update_entity(
    entity_id: int,
    entity_update: EntityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Update entity settings. Only owner can update."""
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Only owner can update
    require_entity_ownership(current_user, entity)
    
    update_data = entity_update.model_dump(exclude_unset=True)
    
    # Check name uniqueness if being updated
    if "name" in update_data:
        existing = db.query(Entity).filter(
            Entity.name == update_data["name"],
            Entity.id != entity_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Entity name already exists")
        
        # Update base_path when name changes
        entity.base_path = f"/api/{update_data['name'].lower().replace(' ', '-')}"
    
    for key, value in update_data.items():
        if key != "name":  # name is handled above with base_path
            setattr(entity, key, value)
        else:
            entity.name = value
    
    db.commit()
    db.refresh(entity)
    return entity

@app.post("/admin/entities/{entity_id}/share", tags=["Admin"])
def share_entity(
    entity_id: int,
    share_request: EntityShareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Share an entity with another user. Only owner can share."""
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Only owner can share
    require_entity_ownership(current_user, entity)
    
    # Get user to share with
    target_user = db.query(User).filter(User.id == share_request.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already shared
    if target_user in entity.users:
        raise HTTPException(status_code=400, detail="Entity already shared with this user")
    
    # Add user to entity's shared users
    entity.users.append(target_user)
    db.commit()
    
    return {"message": f"Entity shared with user {target_user.username}"}

@app.delete("/admin/entities/{entity_id}/share/{user_id}", tags=["Admin"])
def unshare_entity(
    entity_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Revoke entity access from a user. Only owner can unshare."""
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Only owner can unshare
    require_entity_ownership(current_user, entity)
    
    # Get user to unshare with
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if shared
    if target_user not in entity.users:
        raise HTTPException(status_code=400, detail="Entity not shared with this user")
    
    # Remove user from entity's shared users
    entity.users.remove(target_user)
    db.commit()
    
    return {"message": f"Entity access revoked from user {target_user.username}"}

# ==================== Mock Endpoint Management ====================

@app.post("/admin/entities/{entity_id}/endpoints", response_model=MockEndpointResponse, tags=["Admin"])
def create_mock_endpoint(
    entity_id: int,
    endpoint: MockEndpointCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Create a new mock endpoint for an entity. Requires access to the entity."""
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Check entity access
    require_entity_access(current_user, entity)
    
    # Validate JSON response body
    try:
        json.loads(endpoint.response_body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in response_body")
    
    # Validate scenarios if provided
    scenarios_json = "[]"
    if endpoint.response_scenarios:
        scenarios_json = json.dumps([s.model_dump() for s in endpoint.response_scenarios])
    
    # Validate request schema if provided
    if endpoint.request_schema:
        is_valid, error_msg = is_valid_schema(endpoint.request_schema)
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid request schema: {error_msg}"
            )
    
    # Validate callback configuration
    if endpoint.callback_enabled:
        if not endpoint.callback_extract_from_request and not endpoint.callback_url:
            raise HTTPException(
                status_code=400,
                detail="Callback enabled but no callback URL or extraction field configured"
            )
        if endpoint.callback_extract_from_request and not endpoint.callback_extract_field:
            raise HTTPException(
                status_code=400,
                detail="Callback extraction enabled but no field path specified"
            )
    
    db_endpoint = MockEndpoint(
        entity_id=entity_id,
        name=endpoint.name,
        method=endpoint.method.upper(),
        path=endpoint.path,
        response_body=endpoint.response_body,
        response_code=endpoint.response_code,
        response_headers=json.dumps(endpoint.response_headers or {}),
        delay_ms=endpoint.delay_ms,
        is_active=endpoint.is_active,
        response_scenarios=scenarios_json,
        active_scenario_index=endpoint.active_scenario_index,
        # Callback fields
        callback_enabled=endpoint.callback_enabled,
        callback_url=endpoint.callback_url,
        callback_method=endpoint.callback_method.upper() if endpoint.callback_method else "POST",
        callback_delay_ms=endpoint.callback_delay_ms,
        callback_extract_from_request=endpoint.callback_extract_from_request,
        callback_extract_field=endpoint.callback_extract_field,
        callback_payload=endpoint.callback_payload,
        # Schema validation fields
        request_schema=endpoint.request_schema,
        schema_validation_enabled=endpoint.schema_validation_enabled
    )
    db.add(db_endpoint)
    db.commit()
    db.refresh(db_endpoint)
    return db_endpoint

@app.get("/admin/entities/{entity_id}/endpoints", response_model=List[MockEndpointResponse], tags=["Admin"])
def list_mock_endpoints(
    entity_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """List all mock endpoints for an entity. Requires access to the entity."""
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Check entity access
    if current_user:
        require_entity_access(current_user, entity)
    else:
        # Not authenticated - can only view public entity endpoints
        if not entity.is_public:
            raise HTTPException(status_code=401, detail="Authentication required")
    
    return db.query(MockEndpoint).filter(MockEndpoint.entity_id == entity_id).all()

@app.get("/admin/endpoints/{endpoint_id}", response_model=MockEndpointResponse, tags=["Admin"])
def get_mock_endpoint(
    endpoint_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get a specific mock endpoint. Requires access to the associated entity."""
    endpoint = db.query(MockEndpoint).filter(MockEndpoint.id == endpoint_id).first()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    # Check entity access
    entity = endpoint.entity
    if current_user:
        require_entity_access(current_user, entity)
    else:
        # Not authenticated - can only view public entity endpoints
        if not entity.is_public:
            raise HTTPException(status_code=401, detail="Authentication required")
    
    return endpoint

@app.put("/admin/endpoints/{endpoint_id}", response_model=MockEndpointResponse, tags=["Admin"])
def update_mock_endpoint(
    endpoint_id: int,
    endpoint_update: MockEndpointUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Update a mock endpoint. Requires access to the associated entity."""
    db_endpoint = db.query(MockEndpoint).filter(MockEndpoint.id == endpoint_id).first()
    if not db_endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    # Check entity access
    require_entity_access(current_user, db_endpoint.entity)
    
    update_data = endpoint_update.model_dump(exclude_unset=True)
    
    # Validate JSON if response_body is being updated
    if "response_body" in update_data:
        try:
            json.loads(update_data["response_body"])
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON in response_body")
    
    # Convert response_headers dict to JSON string if present
    if "response_headers" in update_data:
        update_data["response_headers"] = json.dumps(update_data["response_headers"])
    
    # Convert response_scenarios to JSON string if present
    if "response_scenarios" in update_data:
        # Handle both Pydantic models and plain dicts
        scenarios_list = []
        for s in update_data["response_scenarios"]:
            if hasattr(s, 'model_dump'):
                scenarios_list.append(s.model_dump())
            else:
                scenarios_list.append(s)  # Already a dict
        update_data["response_scenarios"] = json.dumps(scenarios_list)
    
    # Validate request schema if provided
    if "request_schema" in update_data and update_data["request_schema"]:
        is_valid, error_msg = is_valid_schema(update_data["request_schema"])
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid request schema: {error_msg}"
            )
    
    # Validate callback configuration if being updated
    callback_enabled = update_data.get("callback_enabled", db_endpoint.callback_enabled)
    if callback_enabled:
        callback_url = update_data.get("callback_url", db_endpoint.callback_url)
        callback_extract = update_data.get("callback_extract_from_request", db_endpoint.callback_extract_from_request)
        callback_field = update_data.get("callback_extract_field", db_endpoint.callback_extract_field)
        
        if not callback_extract and not callback_url:
            raise HTTPException(
                status_code=400,
                detail="Callback enabled but no callback URL or extraction field configured"
            )
        if callback_extract and not callback_field:
            raise HTTPException(
                status_code=400,
                detail="Callback extraction enabled but no field path specified"
            )
    
    # Convert method to uppercase if present
    if "method" in update_data:
        update_data["method"] = update_data["method"].upper()
    
    # Convert callback_method to uppercase if present
    if "callback_method" in update_data and update_data["callback_method"]:
        update_data["callback_method"] = update_data["callback_method"].upper()
    
    for key, value in update_data.items():
        setattr(db_endpoint, key, value)
    
    db_endpoint.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_endpoint)
    return db_endpoint

@app.delete("/admin/endpoints/{endpoint_id}", tags=["Admin"])
def delete_mock_endpoint(
    endpoint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Delete a mock endpoint. Requires access to the associated entity."""
    endpoint = db.query(MockEndpoint).filter(MockEndpoint.id == endpoint_id).first()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    # Check entity access
    require_entity_access(current_user, endpoint.entity)
    
    db.delete(endpoint)
    db.commit()
    return {"message": "Endpoint deleted successfully"}

@app.post("/admin/endpoints/{endpoint_id}/switch-scenario/{scenario_index}", tags=["Admin"])
def switch_active_scenario(
    endpoint_id: int,
    scenario_index: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Switch the active response scenario for an endpoint. Requires access to the associated entity."""
    endpoint = db.query(MockEndpoint).filter(MockEndpoint.id == endpoint_id).first()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    # Check entity access
    require_entity_access(current_user, endpoint.entity)
    
    scenarios = json.loads(endpoint.response_scenarios or "[]")
    if not scenarios:
        raise HTTPException(status_code=400, detail="No scenarios configured for this endpoint")
    
    if scenario_index < 0 or scenario_index >= len(scenarios):
        raise HTTPException(status_code=400, detail="Invalid scenario index")
    
    endpoint.active_scenario_index = scenario_index
    endpoint.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(endpoint)
    
    return {
        "message": "Scenario switched successfully",
        "active_scenario": scenarios[scenario_index]
    }

# ==================== Request Logs ====================

@app.get("/admin/entities/{entity_id}/logs", response_model=List[RequestLogResponse], tags=["Admin"])
def get_request_logs(
    entity_id: int,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get request logs for an entity. Requires access to the entity."""
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Check entity access
    if current_user:
        require_entity_access(current_user, entity)
    else:
        # Not authenticated - can only view public entity logs
        if not entity.is_public:
            raise HTTPException(status_code=401, detail="Authentication required")
    
    logs = db.query(RequestLog).filter(
        RequestLog.entity_id == entity_id
    ).order_by(RequestLog.timestamp.desc()).limit(limit).all()
    return logs

@app.get("/admin/endpoints/{endpoint_id}/logs", response_model=List[RequestLogResponse], tags=["Admin"])
def get_endpoint_logs(
    endpoint_id: int,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get request logs for a specific endpoint. Requires access to the associated entity."""
    endpoint = db.query(MockEndpoint).filter(MockEndpoint.id == endpoint_id).first()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    # Check entity access
    entity = endpoint.entity
    if current_user:
        require_entity_access(current_user, entity)
    else:
        # Not authenticated - can only view public entity logs
        if not entity.is_public:
            raise HTTPException(status_code=401, detail="Authentication required")
    
    logs = db.query(RequestLog).filter(
        RequestLog.mock_endpoint_id == endpoint_id
    ).order_by(RequestLog.timestamp.desc()).limit(limit).all()
    return logs

@app.delete("/admin/entities/{entity_id}/logs", tags=["Admin"])
def clear_entity_logs(
    entity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Clear all logs for an entity. Requires access to the entity."""
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Check entity access
    require_entity_access(current_user, entity)
    
    db.query(RequestLog).filter(RequestLog.entity_id == entity_id).delete()
    db.commit()
    return {"message": "Logs cleared successfully"}

# ==================== Dynamic Mock Endpoint Handler ====================

def match_path(pattern: str, actual: str) -> bool:
    """Match URL pattern with path parameters like /users/{id}."""
    pattern_regex = re.sub(r'\{[^}]+\}', r'[^/]+', pattern)
    pattern_regex = f"^{pattern_regex}$"
    return bool(re.match(pattern_regex, actual))

async def handle_mock_request(request: Request, db: Session):
    """Handle dynamic mock endpoint requests."""
    method = request.method
    full_path = request.url.path
    
    # Find entity by base path
    entity = None
    for t in db.query(Entity).all():
        if full_path.startswith(t.base_path):
            entity = t
            break
    
    if not entity:
        return JSONResponse(
            status_code=404,
            content={"error": "Entity not found for this endpoint"}
        )
    
    # Extract the endpoint path (remove entity base path)
    endpoint_path = full_path[len(entity.base_path):]
    if not endpoint_path:
        endpoint_path = "/"
    
    # Find matching mock endpoint
    mock_endpoint = None
    for endpoint in db.query(MockEndpoint).filter(
        MockEndpoint.entity_id == entity.id,
        MockEndpoint.is_active == True
    ).all():
        if endpoint.method == method and match_path(endpoint.path, endpoint_path):
            mock_endpoint = endpoint
            break
    
    # Prepare request data for logging
    request_body = None
    request_data = None
    try:
        request_body = await request.body()
        request_body = request_body.decode('utf-8') if request_body else None
        # Try to parse as JSON
        if request_body:
            try:
                request_data = json.loads(request_body)
            except:
                pass
    except:
        pass
    
    query_params = dict(request.query_params)
    request_headers = dict(request.headers)
    
    # If no matching endpoint found
    if not mock_endpoint:
        log = RequestLog(
            entity_id=entity.id,
            mock_endpoint_id=None,
            method=method,
            path=endpoint_path,
            request_headers=json.dumps(request_headers),
            request_body=request_body,
            query_params=json.dumps(query_params),
            response_code=404,
            response_body=json.dumps({"error": "No matching mock endpoint found"}),
            timestamp=datetime.utcnow()
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        
        # Broadcast log to WebSocket clients
        asyncio.create_task(manager.broadcast_to_entity(entity.id, {
            "type": "new_log",
            "log": {
                "id": log.id,
                "entity_id": log.entity_id,
                "mock_endpoint_id": log.mock_endpoint_id,
                "method": log.method,
                "path": log.path,
                "request_headers": log.request_headers,
                "request_body": log.request_body,
                "query_params": log.query_params,
                "response_code": log.response_code,
                "response_body": log.response_body,
                "timestamp": log.timestamp.replace(tzinfo=timezone.utc).isoformat()
            }
        }))
        
        return JSONResponse(
            status_code=404,
            content={"error": "No matching mock endpoint found"}
        )
    
    # ==================== FEATURE 1: Schema Validation ====================
    # Validate request schema if enabled
    if mock_endpoint.schema_validation_enabled and mock_endpoint.request_schema:
        if request_data is None:
            # Schema validation requires JSON data
            error_response = {"error": "Schema validation enabled but request body is not valid JSON"}
            log = RequestLog(
                entity_id=entity.id,
                mock_endpoint_id=mock_endpoint.id,
                method=method,
                path=endpoint_path,
                request_headers=json.dumps(request_headers),
                request_body=request_body,
                query_params=json.dumps(query_params),
                response_code=400,
                response_body=json.dumps(error_response),
                timestamp=datetime.utcnow()
            )
            db.add(log)
            db.commit()
            db.refresh(log)
            
            asyncio.create_task(manager.broadcast_to_entity(entity.id, {
                "type": "new_log",
                "log": {
                    "id": log.id,
                    "entity_id": log.entity_id,
                    "mock_endpoint_id": log.mock_endpoint_id,
                    "method": log.method,
                    "path": log.path,
                    "request_headers": log.request_headers,
                    "request_body": log.request_body,
                    "query_params": log.query_params,
                    "response_code": log.response_code,
                    "response_body": log.response_body,
                    "timestamp": log.timestamp.replace(tzinfo=timezone.utc).isoformat()
                }
            }))
            
            return JSONResponse(status_code=400, content=error_response)
        
        # Validate against schema
        is_valid, error_message = validate_schema(mock_endpoint.request_schema, request_data)
        if not is_valid:
            error_response = {
                "error": "Request validation failed",
                "details": error_message
            }
            log = RequestLog(
                entity_id=entity.id,
                mock_endpoint_id=mock_endpoint.id,
                method=method,
                path=endpoint_path,
                request_headers=json.dumps(request_headers),
                request_body=request_body,
                query_params=json.dumps(query_params),
                response_code=400,
                response_body=json.dumps(error_response),
                timestamp=datetime.utcnow()
            )
            db.add(log)
            db.commit()
            db.refresh(log)
            
            asyncio.create_task(manager.broadcast_to_entity(entity.id, {
                "type": "new_log",
                "log": {
                    "id": log.id,
                    "entity_id": log.entity_id,
                    "mock_endpoint_id": log.mock_endpoint_id,
                    "method": log.method,
                    "path": log.path,
                    "request_headers": log.request_headers,
                    "request_body": log.request_body,
                    "query_params": log.query_params,
                    "response_code": log.response_code,
                    "response_body": log.response_body,
                    "timestamp": log.timestamp.replace(tzinfo=timezone.utc).isoformat()
                }
            }))
            
            return JSONResponse(status_code=400, content=error_response)
    
    # Determine response based on scenarios or legacy fields
    response_code = mock_endpoint.response_code
    response_body_str = mock_endpoint.response_body
    response_headers_dict = json.loads(mock_endpoint.response_headers)
    delay_ms = mock_endpoint.delay_ms
    
    # Check if scenarios are configured
    scenarios = json.loads(mock_endpoint.response_scenarios or "[]")
    if scenarios and 0 <= mock_endpoint.active_scenario_index < len(scenarios):
        active_scenario = scenarios[mock_endpoint.active_scenario_index]
        response_code = active_scenario["response_code"]
        response_body_str = active_scenario["response_body"]
        response_headers_dict = active_scenario.get("response_headers", {})
        delay_ms = active_scenario.get("delay_ms", 0)  # Use scenario-specific delay
    
    # ==================== FEATURE 2: Placeholder Replacement ====================
    # Replace placeholders in response body
    response_body_str = replace_placeholders(response_body_str)
    
    # Apply delay if configured
    if delay_ms > 0:
        await asyncio.sleep(delay_ms / 1000.0)
    
    # Parse response body
    try:
        response_body_json = json.loads(response_body_str)
    except:
        response_body_json = response_body_str
    
    # Log the request
    log = RequestLog(
        entity_id=entity.id,
        mock_endpoint_id=mock_endpoint.id,
        method=method,
        path=endpoint_path,
        request_headers=json.dumps(request_headers),
        request_body=request_body,
        query_params=json.dumps(query_params),
        response_code=response_code,
        response_body=response_body_str,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    
    # Broadcast log to WebSocket clients
    asyncio.create_task(manager.broadcast_to_entity(entity.id, {
        "type": "new_log",
        "log": {
            "id": log.id,
            "entity_id": log.entity_id,
            "mock_endpoint_id": log.mock_endpoint_id,
            "method": log.method,
            "path": log.path,
            "request_headers": log.request_headers,
            "request_body": log.request_body,
            "query_params": log.query_params,
            "response_code": log.response_code,
            "response_body": log.response_body,
            "timestamp": log.timestamp.replace(tzinfo=timezone.utc).isoformat()
        }
    }))
    
    # ==================== FEATURE 3: Async Callbacks ====================
    # Send async callback if configured
    if mock_endpoint.callback_enabled:
        callback_url = None
        
        # Extract callback URL from request if configured
        if mock_endpoint.callback_extract_from_request and mock_endpoint.callback_extract_field:
            if request_data:
                callback_url = extract_callback_url(request_data, mock_endpoint.callback_extract_field)
                if not callback_url:
                    logger.warning(
                        f"Failed to extract callback URL from field: {mock_endpoint.callback_extract_field}"
                    )
        
        # Use static callback URL if extraction failed or not configured
        if not callback_url:
            callback_url = mock_endpoint.callback_url
        
        # Send callback if URL is available
        if callback_url:
            # Prepare callback payload
            if mock_endpoint.callback_payload:
                # Use custom callback payload with placeholder replacement
                callback_payload_str = replace_placeholders(mock_endpoint.callback_payload)
                try:
                    callback_payload = json.loads(callback_payload_str)
                except json.JSONDecodeError:
                    # If custom payload is not valid JSON, send as-is in a wrapper
                    callback_payload = {"payload": callback_payload_str}
                    logger.warning(f"Custom callback payload is not valid JSON, wrapping it")
            else:
                # Default payload (send back the response)
                callback_payload = {
                    "endpoint": {
                        "method": method,
                        "path": full_path
                    },
                    "request": request_data if request_data else {},
                    "response": response_body_json if isinstance(response_body_json, dict) else {"data": response_body_json},
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            
            # Schedule the callback with configured delay
            schedule_callback(
                url=callback_url,
                method=mock_endpoint.callback_method,
                payload=callback_payload,
                headers=None,  # Use default headers
                delay_ms=mock_endpoint.callback_delay_ms
            )
            logger.info(
                f"Callback scheduled for {callback_url} with delay {mock_endpoint.callback_delay_ms}ms"
            )
        else:
            logger.warning("Callback enabled but no callback URL available")
    
    # Return mock response
    return JSONResponse(
        status_code=response_code,
        content=response_body_json,
        headers=response_headers_dict
    )

# Catch-all route for dynamic mock endpoints
@app.api_route("/api/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"], tags=["Mock"])
async def mock_endpoint_handler(request: Request, db: Session = Depends(get_db)):
    """Handle all mock endpoint requests dynamically."""
    return await handle_mock_request(request, db)

# WebSocket endpoint for real-time logs
@app.websocket("/ws/logs/{entity_id}")
async def websocket_logs(websocket: WebSocket, entity_id: int, token: Optional[str] = None, db: Session = Depends(get_db)):
    """WebSocket endpoint for real-time request logs streaming."""
    # Verify entity exists
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        await websocket.close(code=1008, reason="Entity not found")
        return
    
    # Check access permissions
    # For WebSocket, we'll allow public entities without auth
    # and require auth for private entities
    if not entity.is_public:
        if not token:
            await websocket.close(code=1008, reason="Authentication required for private entity")
            return
        
        user = get_current_user(db, token)
        if not user:
            await websocket.close(code=1008, reason="Invalid token")
            return
        
        if not check_entity_access(user, entity):
            await websocket.close(code=1008, reason="Access denied")
            return
    
    await manager.connect(websocket, entity_id)
    try:
        # Send initial connection message
        await websocket.send_json({
            "type": "connected",
            "entity_id": entity_id,
            "message": "Connected to real-time logs"
        })
        
        # Keep connection alive and listen for client messages
        while True:
            try:
                data = await websocket.receive_text()
                # Echo back or handle ping/pong
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
            except WebSocketDisconnect:
                break
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, entity_id)

# ==================== Admin Dashboard ====================

@app.get("/admin/dashboard/stats", response_model=DashboardStatsResponse, tags=["Admin Dashboard"])
def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get overall system statistics. Admin only."""
    from datetime import timedelta
    
    # Calculate date ranges
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)
    
    # Count totals
    total_users = db.query(User).count()
    total_collections = db.query(Entity).count()
    total_endpoints = db.query(MockEndpoint).count()
    total_requests = db.query(RequestLog).count()
    
    # Count by type
    public_collections = db.query(Entity).filter(Entity.is_public == True).count()
    private_collections = total_collections - public_collections
    admin_users = db.query(User).filter(User.is_admin == True).count()
    
    # Count requests by time
    requests_today = db.query(RequestLog).filter(RequestLog.timestamp >= today).count()
    requests_this_week = db.query(RequestLog).filter(RequestLog.timestamp >= week_ago).count()
    
    return DashboardStatsResponse(
        total_users=total_users,
        total_collections=total_collections,
        total_endpoints=total_endpoints,
        total_requests=total_requests,
        public_collections=public_collections,
        private_collections=private_collections,
        admin_users=admin_users,
        requests_today=requests_today,
        requests_this_week=requests_this_week
    )

@app.get("/admin/dashboard/users", response_model=List[UserStatsResponse], tags=["Admin Dashboard"])
def get_all_users_with_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get all users with their statistics. Admin only."""
    users = db.query(User).all()
    
    user_stats = []
    for user in users:
        # Count collections owned
        collections_owned = db.query(Entity).filter(Entity.owner_id == user.id).count()
        
        # Count collections shared with this user
        collections_shared = len([e for e in user.entities if e.owner_id != user.id])
        
        # Count total endpoints for owned collections
        total_endpoints = db.query(MockEndpoint).join(Entity).filter(
            Entity.owner_id == user.id
        ).count()
        
        # Count total requests for owned collections
        total_requests = db.query(RequestLog).join(Entity).filter(
            Entity.owner_id == user.id
        ).count()
        
        user_stats.append(UserStatsResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            is_admin=user.is_admin,
            created_at=user.created_at,
            collections_owned=collections_owned,
            collections_shared=collections_shared,
            total_endpoints=total_endpoints,
            total_requests=total_requests
        ))
    
    return user_stats

@app.get("/admin/dashboard/collections", response_model=List[CollectionStatsResponse], tags=["Admin Dashboard"])
def get_all_collections_with_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get all collections with their statistics. Admin only."""
    entities = db.query(Entity).all()
    
    collection_stats = []
    for entity in entities:
        # Count endpoints
        endpoint_count = db.query(MockEndpoint).filter(
            MockEndpoint.entity_id == entity.id
        ).count()
        
        # Count requests
        request_count = db.query(RequestLog).filter(
            RequestLog.entity_id == entity.id
        ).count()
        
        # Get last request timestamp
        last_log = db.query(RequestLog).filter(
            RequestLog.entity_id == entity.id
        ).order_by(RequestLog.timestamp.desc()).first()
        
        last_request_at = last_log.timestamp if last_log else None
        
        # Get owner username
        owner = db.query(User).filter(User.id == entity.owner_id).first()
        owner_username = owner.username if owner else "Unknown"
        
        collection_stats.append(CollectionStatsResponse(
            id=entity.id,
            name=entity.name,
            base_path=entity.base_path,
            owner_username=owner_username,
            is_public=entity.is_public,
            created_at=entity.created_at,
            endpoint_count=endpoint_count,
            request_count=request_count,
            last_request_at=last_request_at
        ))
    
    return collection_stats

# Health check
@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow()}
