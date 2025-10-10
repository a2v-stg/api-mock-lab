# 🐳 Docker Quick Start Guide

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose 2.0+ installed
- 2GB free RAM
- Ports 3000, 8001, and 5432 available

## 🚀 Launch in 3 Steps

### Step 1: Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and update these values:
# - POSTGRES_PASSWORD (set a strong password)
# - SECRET_KEY (generate with: openssl rand -hex 32)
```

### Step 2: Build & Start

```bash
# Option A: Using test script (recommended)
./docker-test.sh

# Option B: Manual start
docker-compose up -d --build
```

### Step 3: Access Application

Open your browser and navigate to:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **API Docs:** http://localhost:8001/docs

## 📦 What Gets Deployed

```
┌─────────────────────────────────────────┐
│  mocklab-frontend (Port 3000)           │
│  - Nginx serving React app              │
│  - Proxies API calls to backend         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  mocklab-backend (Port 8001)            │
│  - FastAPI REST API                     │
│  - WebSocket support                    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  mocklab-db (Port 5432)                 │
│  - PostgreSQL 15                        │
│  - Persistent volume storage            │
└─────────────────────────────────────────┘
```

## 🎯 Common Commands

```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Check status
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove all data (WARNING!)
docker-compose down -v

# Restart a service
docker-compose restart backend

# Access database
docker-compose exec db psql -U mocklab -d mocklab
```

## 🧪 First Time Usage

1. **Register an account**
   - Go to http://localhost:3000
   - Click "Get Started - Create Account"
   - Fill in your details

2. **Create your first entity**
   - Click "Create Entity"
   - Give it a name (e.g., "my-api")
   - You'll get a unique base URL: `/api/my-api`

3. **Add a mock endpoint**
   - Click "Explore" on your entity
   - Click "Manage Endpoints"
   - Click "Create Endpoint"
   - Configure scenarios (200, 404, 500, etc.)

4. **Test your mock API**
   ```bash
   curl http://localhost:8001/api/my-api/users
   ```

5. **Monitor in real-time**
   - Watch requests appear live in the UI
   - Switch scenarios to test error handling

## 🔧 Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker info

# Check logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### Port already in use
```bash
# Edit .env file and change ports:
FRONTEND_PORT=3001
BACKEND_PORT=8002
POSTGRES_PORT=5433
```

### Database connection errors
```bash
# Check database is ready
docker-compose exec db pg_isready -U mocklab

# Restart database
docker-compose restart db
```

### Can't access frontend
```bash
# Check if all services are running
docker-compose ps

# All should show "Up" status
# If not, check logs:
docker-compose logs frontend
docker-compose logs backend
```

## 🔐 Production Deployment

For production use:

1. **Update .env with secure values:**
   ```bash
   # Generate secure keys
   SECRET_KEY=$(openssl rand -hex 32)
   POSTGRES_PASSWORD=$(openssl rand -base64 32)
   ```

2. **Use proper ports:**
   ```bash
   FRONTEND_PORT=80  # or 443 for HTTPS
   ```

3. **Enable HTTPS** (see DEPLOYMENT.md for full guide)

4. **Set up backups:**
   ```bash
   # Backup database
   docker-compose exec db pg_dump -U mocklab mocklab > backup.sql
   ```

5. **Monitor resources:**
   ```bash
   docker stats
   ```

## 📚 Additional Resources

- **Full Deployment Guide:** See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Feature Documentation:** See [FEATURES.md](FEATURES.md)
- **Development Guide:** See [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)
- **Main README:** See [README.md](README.md)

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify .env configuration
3. Ensure ports are available
4. Check Docker resources (RAM, disk)
5. Review DEPLOYMENT.md for detailed troubleshooting

## 🎉 Success!

Once everything is running:
- ✅ Frontend accessible at http://localhost:3000
- ✅ Backend healthy at http://localhost:8001/health
- ✅ Database accepting connections
- ✅ Real-time WebSocket working

**You're ready to start mocking APIs!** 🚀
