# 🛠️ Mock-Lab - Development Guide

## Table of Contents
1. [Setup & Installation](#setup--installation)
2. [Architecture Overview](#architecture-overview)
3. [Backend Development](#backend-development)
4. [Frontend Development](#frontend-development)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Troubleshooting](#troubleshooting)
8. [Deployment](#deployment)

---

## Setup & Installation

### Prerequisites
```bash
# Required
Python 3.12+
Node.js 16+
npm or yarn

# Recommended
pyenv (Python version management)
nvm (Node version management)
```

### Initial Setup

**1. Clone Repository**
```bash
git clone <repository-url>
cd mocker
```

**2. Backend Setup**
```bash
# Install Python dependencies
pip install -r requirements.txt

# Verify installation
python -c "import fastapi; print('FastAPI OK')"
```

**3. Frontend Setup**
```bash
cd frontend
npm install
cd ..
```

**4. Environment Configuration**
```bash
# Create .env file (optional)
echo "SECRET_KEY=your-super-secret-key-change-in-production" > .env
echo "DATABASE_URL=sqlite:///./mocker.db" >> .env
```

### Starting Services

**Backend (Port 8001):**
```bash
# Option 1: Using script
./start-backend.sh

# Option 2: Direct command
uvicorn backend.main:app --reload --port 8001 --host 127.0.0.1

# Option 3: Background process
nohup uvicorn backend.main:app --reload --port 8001 > backend.log 2>&1 &
```

**Frontend (Port 3000):**
```bash
# Option 1: Using script
./start-frontend.sh

# Option 2: Direct command
cd frontend && npm run dev

# Option 3: Background process
cd frontend && nohup npm run dev > /dev/null 2>&1 &
```

### Verification
```bash
# Check services
lsof -ti:8001  # Backend
lsof -ti:3000  # Frontend

# Test backend
curl http://127.0.0.1:8001/health

# Test frontend
curl http://localhost:3000
```

---

## Architecture Overview

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                        │
│                  http://localhost:3000                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              VITE DEV SERVER (Port 3000)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React Application (SPA)                               │ │
│  │  - Components: Landing, Login, Register, Entities      │ │
│  │  - Auth Context Provider                               │ │
│  │  - Protected Routes                                    │ │
│  │  - WebSocket Client                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Vite Proxy Configuration                             │ │
│  │  /auth/* → http://127.0.0.1:8001                      │ │
│  │  /admin/* → http://127.0.0.1:8001                     │ │
│  │  /api/* → http://127.0.0.1:8001                       │ │
│  │  /ws → ws://127.0.0.1:8001                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│             FASTAPI BACKEND (Port 8001)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Route Handlers                                        │ │
│  │  - /auth/* (Authentication)                            │ │
│  │  - /admin/* (Entity/Endpoint Management)               │ │
│  │  - /api/{entity}/* (Dynamic Mock Endpoints)            │ │
│  │  - /ws/logs/{entity_id} (WebSocket)                    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Business Logic                                        │ │
│  │  - Dynamic endpoint creation                           │ │
│  │  - Scenario-based responses                            │ │
│  │  - Request logging                                     │ │
│  │  - WebSocket broadcasting                              │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  SQLAlchemy ORM                                        │ │
│  │  - Models: User, Entity, MockEndpoint, RequestLog      │ │
│  │  - Relationships & Constraints                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   SQLite DATABASE                            │
│                    (mocker.db)                               │
│  - users                                                     │
│  - entities                                                  │
│  - user_entity_association                                   │
│  - mock_endpoints                                            │
│  - request_logs                                              │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

**1. User Authentication:**
```
Browser → /register → Vite Proxy → /auth/register → FastAPI
                                                    ↓
                                            Create User (bcrypt)
                                                    ↓
                                            Return User Data
                                                    ↓
Frontend ← Token Stored in localStorage ← Response
```

**2. Mock API Request:**
```
External Client → GET /api/my-app/users → FastAPI
                                            ↓
                                    Find Entity "my-app"
                                            ↓
                                    Find Endpoint "/users"
                                            ↓
                                    Get Active Scenario
                                            ↓
                                    Apply Delay (if configured)
                                            ↓
                                    Log Request
                                            ↓
                                    Broadcast via WebSocket
                                            ↓
Client ← Response (status, body, headers) ←
```

**3. Real-Time Monitoring:**
```
Frontend → WebSocket Connect → /ws/logs/1 → FastAPI
                                              ↓
                                    Store Connection
                                              ↓
When Request Arrives → Log Created → Broadcast to WebSocket
                                              ↓
Frontend ← Receives Log Data ← WebSocket Message
         ↓
    Updates UI in Real-Time
```

### Technology Stack Details

**Backend:**
- **FastAPI 0.104+**: Modern Python web framework
- **SQLAlchemy 2.0+**: ORM with async support
- **Pydantic 2.5+**: Data validation and serialization
- **bcrypt 4.1+**: Password hashing
- **uvicorn**: ASGI server
- **WebSockets**: Built into FastAPI
- **email-validator**: Email validation

**Frontend:**
- **React 18**: UI library with hooks
- **Vite 5**: Fast build tool and dev server
- **Tailwind CSS 3**: Utility-first CSS
- **React Router 6**: Client-side routing
- **Axios**: HTTP client with interceptors
- **Lucide React**: Icon library

---

## Backend Development

### Project Structure
```
backend/
├── main.py           # FastAPI app, routes, WebSocket
├── models.py         # SQLAlchemy ORM models
├── schemas.py        # Pydantic request/response schemas
├── auth.py           # Authentication utilities
├── database.py       # Database connection setup
└── __init__.py       # Package marker
```

### Key Files

**1. main.py**
```python
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="API Mocker")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
@app.post("/auth/register")
@app.post("/auth/login")
@app.get("/admin/entities")
@app.post("/admin/entities")
# ... more routes

# Dynamic mock endpoint handler
@app.api_route("/api/{entity_path}/{full_path:path}", methods=["GET", "POST", ...])
async def handle_mock_request(...)

# WebSocket
@app.websocket("/ws/logs/{entity_id}")
async def websocket_endpoint(...)
```

**2. models.py**
```python
from sqlalchemy import Column, Integer, String, Boolean, Text, Table
from sqlalchemy.orm import relationship

# User model
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    username = Column(String, unique=True)
    hashed_password = Column(String)
    
# Entity model (renamed from Tenant)
class Entity(Base):
    __tablename__ = "entities"
    # ... fields

# Many-to-many relationship
user_entity_association = Table('user_entity_association', ...)
```

**3. schemas.py**
```python
from pydantic import BaseModel, EmailStr, field_serializer
from typing import List, Optional

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class ResponseScenario(BaseModel):
    name: str
    response_code: int
    response_body: dict
    response_headers: Optional[dict] = {}
    delay_ms: int = 0
```

**4. auth.py**
```python
import bcrypt
import secrets

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_access_token(user_id: int) -> str:
    return secrets.token_urlsafe(32)
```

### Adding New Features

**1. New Endpoint:**
```python
@app.get("/admin/entities/{entity_id}/stats")
async def get_entity_stats(entity_id: int, db: Session = Depends(get_db)):
    # Logic here
    return {"total_requests": 100, "avg_response_time": 50}
```

**2. New Model Field:**
```python
# In models.py
class Entity(Base):
    # ... existing fields
    description = Column(String, nullable=True)  # New field

# Reset database or migrate
rm mocker.db  # WARNING: Deletes data!
# Restart backend to recreate tables
```

**3. New Pydantic Schema:**
```python
# In schemas.py
class EntityStats(BaseModel):
    total_requests: int
    avg_response_time: float
    last_request: Optional[datetime]
```

### Testing Backend

**Manual Testing:**
```bash
# Health check
curl http://127.0.0.1:8001/health

# Register user
curl -X POST http://127.0.0.1:8001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"test","password":"test123"}'

# Login
curl -X POST http://127.0.0.1:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Create entity
curl -X POST http://127.0.0.1:8001/admin/entities \
  -H "Content-Type: application/json" \
  -d '{"name":"test-app"}'
```

**Automated Testing (Future):**
```python
# tests/test_auth.py
import pytest
from fastapi.testclient import TestClient

def test_register():
    response = client.post("/auth/register", json={...})
    assert response.status_code == 200
```

---

## Frontend Development

### Project Structure
```
frontend/
├── src/
│   ├── App.jsx          # Main component (1600+ lines)
│   ├── main.jsx         # Entry point
│   └── index.css        # Tailwind imports
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.js       # Vite + proxy config
├── tailwind.config.js   # Tailwind config
├── postcss.config.js    # PostCSS config
└── package.json         # Dependencies
```

### Key Components

**App.jsx Structure:**
```javascript
// Auth Context
const AuthContext = createContext(null)
function AuthProvider({ children }) { ... }

// Components
function Navbar() { ... }
function LandingPage() { ... }
function LoginPage() { ... }
function RegisterPage() { ... }
function ProtectedRoute({ children }) { ... }
function EntitiesPage() { ... }
function EntityDetail() { ... }
function EndpointForm() { ... }
function LogListItem() { ... }
function LogDetailView() { ... }

// Main App
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/entities" element={<ProtectedRoute>...</ProtectedRoute>} />
          <Route path="/entity/:entityId" element={<ProtectedRoute>...</ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
```

### Vite Proxy Configuration

**vite.config.js:**
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        secure: false
      },
      '/admin': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'ws://127.0.0.1:8001',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
```

### State Management

**Auth Context:**
```javascript
const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  
  const login = (userData, token) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user_data', JSON.stringify(userData))
    setUser(userData)
  }
  
  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setUser(null)
  }
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
```

**API Client:**
```javascript
const api = axios.create({ baseURL: '' })

// Auto-attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Adding New Features

**1. New Page/Component:**
```javascript
function MyNewPage() {
  const [data, setData] = useState([])
  
  useEffect(() => {
    fetchData()
  }, [])
  
  const fetchData = async () => {
    const response = await api.get('/admin/my-endpoint')
    setData(response.data)
  }
  
  return (
    <div>
      {/* Your UI */}
    </div>
  )
}

// Add route in App()
<Route path="/my-page" element={<MyNewPage />} />
```

**2. New API Integration:**
```javascript
// GET request
const response = await api.get('/admin/endpoint')

// POST request
const response = await api.post('/admin/endpoint', {
  data: 'value'
})

// With error handling
try {
  const response = await api.get('/admin/endpoint')
  setData(response.data)
} catch (error) {
  setError(error.response?.data?.detail || 'Error occurred')
}
```

### Styling with Tailwind

**Common Patterns:**
```javascript
// Button
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
  Click Me
</button>

// Card
<div className="bg-white rounded-lg shadow-md p-6">
  Content
</div>

// Form Input
<input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />

// Grid Layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

---

## Database Schema

### Entity Relationship Diagram
```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ email (UNIQUE)  │
│ username (UNIQUE)│
│ hashed_password │
│ created_at      │
└─────────────────┘
         │
         │ many-to-many
         ↓
┌────────────────────────┐
│ user_entity_association│
├────────────────────────┤
│ user_id (FK)           │
│ entity_id (FK)         │
└────────────────────────┘
         │
         ↓
┌─────────────────┐
│    entities     │
├─────────────────┤
│ id (PK)         │
│ name (UNIQUE)   │
│ api_key         │
│ created_at      │
└─────────────────┘
         │
         │ one-to-many
         ↓
┌──────────────────────────┐
│    mock_endpoints        │
├──────────────────────────┤
│ id (PK)                  │
│ entity_id (FK)           │
│ name                     │
│ method                   │
│ path                     │
│ response_scenarios (JSON)│
│ active_scenario_index    │
│ is_active                │
│ created_at               │
│ updated_at               │
└──────────────────────────┘
         │
         │ one-to-many
         ↓
┌─────────────────┐
│  request_logs   │
├─────────────────┤
│ id (PK)         │
│ entity_id (FK)  │
│ method          │
│ path            │
│ request_body    │
│ request_headers │
│ response_code   │
│ response_body   │
│ response_headers│
│ timestamp       │
└─────────────────┘
```

### Table Details

**users:**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**entities:**
```sql
CREATE TABLE entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR UNIQUE NOT NULL,
    api_key VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**mock_endpoints:**
```sql
CREATE TABLE mock_endpoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id INTEGER NOT NULL,
    name VARCHAR NOT NULL,
    method VARCHAR NOT NULL,
    path VARCHAR NOT NULL,
    response_scenarios TEXT,  -- JSON array
    active_scenario_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);
```

**request_logs:**
```sql
CREATE TABLE request_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id INTEGER NOT NULL,
    method VARCHAR NOT NULL,
    path VARCHAR NOT NULL,
    request_body TEXT,
    request_headers TEXT,
    response_code INTEGER,
    response_body TEXT,
    response_headers TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);
```

### Database Operations

**Reset Database:**
```bash
# WARNING: Deletes all data!
rm mocker.db

# Restart backend to recreate tables
uvicorn backend.main:app --reload --port 8001
```

**Backup Database:**
```bash
cp mocker.db mocker_backup_$(date +%Y%m%d).db
```

**Inspect Database:**
```bash
sqlite3 mocker.db

.tables
.schema users
SELECT * FROM entities;
.quit
```

---

## API Documentation

### Authentication Endpoints

**POST /auth/register**
```json
Request:
{
  "email": "user@example.com",
  "username": "developer",
  "password": "secure123"
}

Response (200):
{
  "id": 1,
  "email": "user@example.com",
  "username": "developer",
  "created_at": "2025-10-09T10:00:00"
}
```

**POST /auth/login**
```json
Request:
{
  "username": "developer",
  "password": "secure123"
}

Response (200):
{
  "user": {...},
  "token": "abc123...",
  "message": "Login successful"
}
```

### Entity Endpoints

**POST /admin/entities**
```json
Request:
{
  "name": "my-app"
}

Response (200):
{
  "id": 1,
  "name": "my-app",
  "api_key": "abc-def-123",
  "created_at": "2025-10-09T10:00:00"
}
```

**GET /admin/entities**
```json
Response (200):
[
  {
    "id": 1,
    "name": "my-app",
    "api_key": "abc-def-123",
    "created_at": "2025-10-09T10:00:00"
  }
]
```

### Mock Endpoint Endpoints

**POST /admin/entities/{entity_id}/endpoints**
```json
Request:
{
  "name": "Get Users",
  "method": "GET",
  "path": "/users",
  "response_scenarios": [
    {
      "name": "Success",
      "response_code": 200,
      "response_body": {"users": [...]},
      "response_headers": {},
      "delay_ms": 0
    }
  ],
  "active_scenario_index": 0
}

Response (200):
{
  "id": 1,
  "entity_id": 1,
  "name": "Get Users",
  // ... full endpoint data
}
```

---

## Troubleshooting

### Common Issues

**1. Backend Won't Start**
```bash
# Check port availability
lsof -ti:8001
# If occupied, kill process
kill -9 $(lsof -ti:8001)

# Check Python dependencies
pip list | grep fastapi

# Reinstall if needed
pip install -r requirements.txt --force-reinstall
```

**2. Frontend Won't Start**
```bash
# Clear Vite cache
cd frontend
rm -rf node_modules/.vite

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Start fresh
npm run dev
```

**3. Database Errors**
```bash
# SQLAlchemy operational error
# Usually means schema mismatch

# Solution: Reset database
rm mocker.db
# Restart backend
```

**4. Proxy Not Working**
```bash
# Vite proxy issues

# 1. Verify backend is running
curl http://127.0.0.1:8001/health

# 2. Check Vite proxy config
cat frontend/vite.config.js

# 3. Restart frontend
cd frontend
npm run dev
```

**5. WebSocket Connection Fails**
```javascript
// Check browser console for errors

// Verify WebSocket proxy in vite.config.js:
'/ws': {
  target: 'ws://127.0.0.1:8001',
  ws: true,
  changeOrigin: true
}
```

**6. Authentication Issues**
```bash
# Token not being sent

# Check localStorage
# In browser console:
localStorage.getItem('auth_token')

# Clear and re-login
localStorage.clear()
# Then register/login again
```

### Debug Mode

**Backend:**
```python
# In main.py
import logging
logging.basicConfig(level=logging.DEBUG)

# Or run with debug flag
uvicorn backend.main:app --reload --log-level debug
```

**Frontend:**
```javascript
// In App.jsx
console.log('API Response:', response.data)
console.log('Current User:', auth.user)
console.log('WebSocket Message:', data)
```

### Performance Issues

**Slow Responses:**
```bash
# Check database size
ls -lh mocker.db

# Clear old logs
# Via UI: Click "Clear Logs" button
# Or SQL:
sqlite3 mocker.db "DELETE FROM request_logs WHERE timestamp < datetime('now', '-7 days');"
```

**Memory Issues:**
```bash
# Check running processes
ps aux | grep uvicorn
ps aux | grep node

# Restart services
pkill -f uvicorn
pkill -f vite
# Then start again
```

---

## Deployment

### Production Setup

**1. Backend (Production Server)**
```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn backend.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8001 \
  --access-logfile - \
  --error-logfile -
```

**2. Frontend (Static Build)**
```bash
cd frontend
npm run build

# Output in: frontend/dist/
# Serve with nginx, apache, or CDN
```

**3. Environment Variables**
```bash
# .env.production
SECRET_KEY=super-secret-production-key
DATABASE_URL=postgresql://user:pass@localhost/mocker
ALLOWED_ORIGINS=https://yourdomain.com
```

**4. Database Migration**
```bash
# SQLite → PostgreSQL

# 1. Install psycopg2
pip install psycopg2-binary

# 2. Update database.py
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mocker.db")

# 3. Run migrations (if using Alembic)
alembic upgrade head
```

### Docker Deployment (Future)

```dockerfile
# Dockerfile
FROM python:3.12
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ ./backend/
CMD ["gunicorn", "backend.main:app", "-k", "uvicorn.workers.UvicornWorker"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql://...
  frontend:
    image: nginx:alpine
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
    ports:
      - "80:80"
```

### Monitoring

**Health Checks:**
```bash
# Backend health
curl http://yourserver:8001/health

# Frontend
curl http://yourserver/

# Database
sqlite3 mocker.db "SELECT COUNT(*) FROM entities;"
```

**Logging:**
```python
# backend/main.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
```

---

## Development Workflow

### Git Workflow
```bash
# Feature branch
git checkout -b feature/my-feature

# Make changes
# ... code ...

# Commit
git add .
git commit -m "feat: add new feature"

# Push
git push origin feature/my-feature

# Create PR on GitHub
```

### Code Quality

**Python (Backend):**
```bash
# Formatting
black backend/

# Linting
flake8 backend/

# Type checking
mypy backend/
```

**JavaScript (Frontend):**
```bash
# Formatting
cd frontend
npx prettier --write src/

# Linting
npm run lint
```

### Testing Strategy

**Unit Tests:**
```python
# tests/test_endpoints.py
def test_create_endpoint():
    response = client.post("/admin/entities/1/endpoints", json={...})
    assert response.status_code == 200
```

**Integration Tests:**
```python
def test_full_flow():
    # Register → Create Entity → Add Endpoint → Test Mock API
    pass
```

**E2E Tests:**
```javascript
// cypress/e2e/auth.cy.js
describe('Authentication', () => {
  it('should register and login', () => {
    cy.visit('/register')
    cy.get('input[name="email"]').type('test@test.com')
    // ...
  })
})
```

---

**Happy Coding! 🚀**
