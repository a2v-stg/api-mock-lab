# 🧪 Mock-Lab

> Dynamic API mocking service with real-time monitoring, scenario-based testing, and no-code configuration.

![Status](https://img.shields.io/badge/status-active-success.svg)
![Python](https://img.shields.io/badge/python-3.12-blue.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)

## 📝 What It Does

**Mock-Lab** is a dynamic API mocking service that lets you create, configure, and test API endpoints without writing code. Create unique entities (projects) with custom mock endpoints, define multiple response scenarios (200, 404, 429, 500, etc.) with different payloads and delays, and switch between them instantly via a web UI. Monitor all API traffic in real-time with WebSocket updates, featuring a two-panel interface showing request/response details. Includes user authentication, multi-user support, scenario-based testing, and configurable delays for simulating timeouts. Perfect for frontend development, testing, and API prototyping.

**Perfect for:**
- 🎨 Frontend development before backend is ready
- 🧪 Testing error scenarios (timeouts, rate limits, failures)
- 🔄 API prototyping and iteration
- 📊 Training and demos
- 👥 Team collaboration

## ✨ Key Features

### Core Functionality
- ✅ **Dynamic Mock APIs** - Create endpoints on-demand via UI
- ✅ **Multi-Entity Support** - Organize endpoints by project/service
- ✅ **Unique Base Paths** - Each entity gets `/api/{entity-name}/*`
- ✅ **All HTTP Methods** - GET, POST, PUT, DELETE, PATCH supported

### Advanced Features
- 🎯 **Response Scenarios** - Multiple responses per endpoint (200, 404, 429, 500, etc.)
- ⚡ **Instant Scenario Switching** - Change responses without restarts
- ⏱️ **Configurable Delays** - Per-scenario delays for timeout simulation
- 📡 **Real-Time Monitoring** - WebSocket-powered live traffic display
- 🔐 **User Authentication** - Secure login with multi-user support
- 📊 **Two-Panel UI** - Request list + detailed view with collapsible sections

### Developer Experience
- 🎨 **No-Code Configuration** - All setup via beautiful web UI
- 🔍 **Search & Filter** - Find requests quickly
- 🎨 **Color-Coded Routes** - Visual organization
- ⏰ **Time-Ago Display** - Auto-updating timestamps
- 📋 **Copy-Paste Ready** - Easy endpoint URLs

## 🚀 Quick Start

### Option 1: Docker (Recommended for Production)

**Prerequisites:** Docker & Docker Compose

```bash
# 1. Clone repository
git clone <your-repo>
cd api-mock-lab

# 2. Setup environment
cp .env.example .env
# Edit .env and update SECRET_KEY and POSTGRES_PASSWORD

# 3. Start with Docker
cd deploy/docker
docker-compose up -d --build

# Or use Makefile
make up

# Or run automated test
./docker-test.sh
```

**Access:** http://localhost:3000

📚 **See [deploy/docs/DOCKER_QUICK_START.md](deploy/docs/DOCKER_QUICK_START.md) for detailed guide**

### Option 2: Local Development

**Prerequisites:** Python 3.12+, Node.js 16+

```bash
# 1. Clone & Setup
git clone <your-repo>
cd api-mock-lab

# Backend setup
pip install -r requirements.txt

# Frontend setup
cd frontend
npm install
cd ..

# 2. Start Services
# Terminal 1 - Backend
./start-backend.sh

# Terminal 2 - Frontend
./start-frontend.sh
```

**Access:** http://localhost:3000

## 📖 Usage Guide

### Step 1: Create Account
1. Go to `http://localhost:3000/register`
2. Fill in email, username, password
3. Click "Create Account" → Auto-logged in!

### Step 2: Create Entity
1. On "My Entities" page, enter entity name
2. Click "Create Entity"
3. Copy your unique base URL: `/api/{entity-name}`

### Step 3: Add Mock Endpoint
1. Click "Monitor" on your entity
2. Click "Show Endpoints" → "+ Create Endpoint"
3. Configure:
   - **Name**: Descriptive name
   - **Method**: GET, POST, etc.
   - **Path**: `/users`, `/orders/{id}`, etc.
   - **Add Scenarios**: Define multiple responses

### Step 4: Add Response Scenarios
```
Scenario 1: Success
- Status Code: 200
- Body: {"success": true, "data": [...]}
- Delay: 0ms

Scenario 2: Rate Limited
- Status Code: 429
- Body: {"error": "Too many requests"}
- Delay: 0ms

Scenario 3: Timeout
- Status Code: 504
- Body: {"error": "Gateway timeout"}
- Delay: 5000ms
```

### Step 5: Test Your API
```bash
# Your mock endpoint is live!
curl http://localhost:8001/api/my-entity/users

# Switch scenarios via UI dropdown
# Monitor requests in real-time
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  Frontend (React + Vite) - Port 3000   │
│  - Beautiful UI with Tailwind CSS       │
│  - Real-time WebSocket updates          │
│  - Authentication & routing             │
└─────────────────────────────────────────┘
                    │
                    ↓ (Vite Proxy)
┌─────────────────────────────────────────┐
│  Backend (FastAPI) - Port 8001          │
│  - Dynamic endpoint creation            │
│  - Scenario-based responses             │
│  - Traffic logging & WebSocket          │
│  - User authentication                  │
└─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────┐
│  Database (SQLite)                      │
│  - Users, Entities, Endpoints, Logs     │
│  - Response scenarios (JSON)            │
└─────────────────────────────────────────┘
```

## 🔧 Technology Stack

**Backend:**
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- SQLite (Database)
- WebSockets (Real-time updates)
- bcrypt (Password hashing)
- Pydantic (Data validation)

**Frontend:**
- React 18
- Vite (Build tool)
- Tailwind CSS (Styling)
- React Router (Navigation)
- Axios (HTTP client)
- Lucide React (Icons)

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user

### Entity Management
- `POST /admin/entities` - Create entity
- `GET /admin/entities` - List entities
- `GET /admin/entities/{id}` - Get entity details
- `DELETE /admin/entities/{id}` - Delete entity

### Mock Endpoint Management
- `POST /admin/entities/{id}/endpoints` - Create endpoint
- `GET /admin/entities/{id}/endpoints` - List endpoints
- `PUT /admin/endpoints/{id}` - Update endpoint
- `DELETE /admin/endpoints/{id}` - Delete endpoint
- `POST /admin/endpoints/{id}/switch-scenario/{index}` - Switch scenario

### Traffic Monitoring
- `GET /admin/entities/{id}/logs` - Get request logs
- `DELETE /admin/entities/{id}/logs` - Clear logs
- `WS /ws/logs/{entity_id}` - WebSocket for real-time logs

### Dynamic Mock APIs
- `GET|POST|PUT|DELETE|PATCH /api/{entity-path}/*` - Your mock endpoints!

## 🎯 Use Cases

### 1. Frontend Development
```javascript
// Backend not ready? Use mock API!
fetch('http://localhost:8001/api/my-app/users')
  .then(res => res.json())
  .then(data => console.log(data))
```

### 2. Error Scenario Testing
```javascript
// Test how your app handles 429 rate limits
// Just switch scenario in UI → instant 429 responses

// Test timeout handling
// Set 5000ms delay → simulate slow APIs
```

### 3. API Prototyping
- Design API contracts
- Test different response structures
- Validate before backend implementation

### 4. Training & Demos
- Demonstrate API integrations
- No backend setup required
- Instant scenario switching

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ Token-based authentication
- ✅ Protected routes (entities require login)
- ✅ Session management
- ✅ Email validation
- ✅ Unique username/email constraints

## 🐛 Troubleshooting

**Frontend won't start:**
```bash
cd frontend
rm -rf node_modules/.vite
npm install
npm run dev
```

**Backend connection errors:**
```bash
# Check if backend is running
lsof -ti:8001

# Restart backend
pkill -f "uvicorn backend.main"
uvicorn backend.main:app --reload --port 8001
```

**Database issues:**
```bash
# Reset database (WARNING: Deletes all data!)
rm mocker.db
# Restart backend to recreate tables
```

**Proxy errors:**
- Frontend proxy config in `frontend/vite.config.js`
- Restart frontend after proxy changes

## 📁 Project Structure

```
mocker/
├── backend/
│   ├── main.py          # FastAPI app
│   ├── models.py        # Database models
│   ├── schemas.py       # Pydantic schemas
│   ├── auth.py          # Authentication
│   └── database.py      # DB setup
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main React app
│   │   ├── main.jsx     # Entry point
│   │   └── index.css    # Styles
│   ├── vite.config.js   # Vite + proxy config
│   └── package.json     # Dependencies
├── mocker.db            # SQLite database
├── requirements.txt     # Python deps
├── README.md           # This file
└── start-*.sh          # Start scripts
```

## 🚢 Deployment

All deployment configurations are in the **`deploy/`** directory.

### Docker Deployment (Local/VPS)

```bash
cd deploy/docker
docker-compose up -d --build

# Or using Makefile
make up
```

📚 **Guide:** [deploy/docs/DOCKER_QUICK_START.md](deploy/docs/DOCKER_QUICK_START.md)

### AWS ECS (Fargate) - Recommended for Cloud ✅

```bash
cd deploy/aws-ecs
./deploy.sh
```

📚 **Guide:** [deploy/docs/ECS_DEPLOYMENT_GUIDE.md](deploy/docs/ECS_DEPLOYMENT_GUIDE.md)

### AWS EKS (Kubernetes)

```bash
cd deploy/kubernetes
kubectl apply -f .
```

📚 **Guide:** [deploy/docs/EKS_DEPLOYMENT_GUIDE.md](deploy/docs/EKS_DEPLOYMENT_GUIDE.md)

### Complete Deployment Overview

See **[deploy/README.md](deploy/README.md)** for:
- Deployment method comparison
- Cost estimates
- Architecture decisions
- Complete guides for all platforms

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- 📖 Full documentation: See `FEATURES.md` and `DEVELOPMENT_GUIDE.md`
- 🐛 Issues: Open a GitHub issue
- 💬 Questions: Start a discussion

## 🎉 Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

---

**Ready to mock? Start now:** `http://localhost:3000` 🚀
