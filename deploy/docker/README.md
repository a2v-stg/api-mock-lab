# 🐳 Docker Deployment

This directory contains all Docker-related deployment files for Mock-Lab.

## 📁 Files

- **`docker-compose.yml`** - Production setup with separate services (PostgreSQL + Backend + Frontend)
- **`docker-compose.monolith.yml`** - Alternative single-service setup
- **`Dockerfile.backend`** - Backend container (Python + FastAPI)
- **`Dockerfile.frontend`** - Frontend container (Node build + Nginx)
- **`Dockerfile.monolith`** - Monolith container (Both services in one)
- **`nginx.conf`** - Nginx configuration for frontend
- **`nginx-monolith.conf`** - Nginx configuration for monolith
- **`supervisord.conf`** - Supervisor configuration for monolith
- **`docker-test.sh`** - Automated deployment test script
- **`Makefile`** - Convenient commands for common tasks

## 🚀 Quick Start

### 1. Setup Environment

```bash
# From project root
cp .env.example .env

# Edit .env and update:
# - POSTGRES_PASSWORD
# - SECRET_KEY
```

### 2. Deploy

```bash
cd deploy/docker

# Option A: Using Makefile
make up

# Option B: Using docker-compose
docker-compose up -d --build

# Option C: Run automated test
./docker-test.sh
```

### 3. Access

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **API Docs:** http://localhost:8001/docs

## 📋 Using the Makefile

```bash
# Start services
make up

# Stop services
make down

# View logs
make logs-f

# Check status
make status

# Backup database
make db-backup

# Restore database
make db-restore FILE=backup.sql

# Run tests
make test

# Clean everything (WARNING: deletes data!)
make clean

# Complete reset
make reset
```

## 🔧 Manual Commands

### Build and Start
```bash
docker-compose build
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Check Status
```bash
docker-compose ps
```

### Stop Services
```bash
docker-compose down
```

### Scale Services
```bash
# Scale backend to 5 instances
docker-compose up -d --scale backend=5
```

## 🗄️ Database Operations

### Backup
```bash
# Using Makefile
make db-backup

# Manual
docker-compose exec db pg_dump -U mocklab mocklab > backup.sql
```

### Restore
```bash
# Using Makefile
make db-restore FILE=backup.sql

# Manual
docker-compose exec -T db psql -U mocklab mocklab < backup.sql
```

### Access Database Shell
```bash
# Using Makefile
make db-shell

# Manual
docker-compose exec db psql -U mocklab -d mocklab
```

## 🔄 Updates

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Update Single Service
```bash
# Backend only
docker-compose up -d --build backend

# Frontend only
docker-compose up -d --build frontend
```

## 📊 Monitoring

### Resource Usage
```bash
docker stats
```

### Health Checks
```bash
# Backend
curl http://localhost:8001/health

# Frontend
curl http://localhost:3000
```

## 🐛 Troubleshooting

### Services Won't Start
```bash
# Check logs
docker-compose logs

# Check Docker
docker info

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### Port Conflicts
Edit `.env` file:
```bash
FRONTEND_PORT=3001
BACKEND_PORT=8002
POSTGRES_PORT=5433
```

### Database Connection Issues
```bash
# Check database
docker-compose exec db pg_isready -U mocklab

# Restart database
docker-compose restart db
```

## 📚 Documentation

- [Quick Start Guide](../docs/DOCKER_QUICK_START.md)
- [Complete Setup Summary](../docs/DOCKER_SETUP_SUMMARY.md)
- [Full Deployment Guide](../docs/DEPLOYMENT.md)
- [Architecture Comparison](../docs/ARCHITECTURE_COMPARISON.md)

## ⚙️ Configuration

### Environment Variables

Edit `.env` in project root:

```bash
# Database
POSTGRES_DB=mocklab
POSTGRES_USER=mocklab
POSTGRES_PASSWORD=your_secure_password
POSTGRES_PORT=5432

# Application
SECRET_KEY=your_secret_key_here
DATABASE_URL=postgresql://mocklab:password@db:5432/mocklab

# Ports
BACKEND_PORT=8001
FRONTEND_PORT=3000
```

### Custom Configuration

**Backend:** Edit `Dockerfile.backend`
**Frontend:** Edit `Dockerfile.frontend`
**Nginx:** Edit `nginx.conf`

## 🔒 Security

- Never commit `.env` file
- Change default passwords
- Use strong SECRET_KEY
- Enable HTTPS in production
- Keep Docker images updated

## 💡 Tips

1. **Use Fargate Spot for production** - See [ECS Guide](../docs/ECS_DEPLOYMENT_GUIDE.md)
2. **Frontend on S3+CloudFront** - Better performance, cheaper
3. **Regular backups** - Use `make db-backup` daily
4. **Monitor resources** - Use `docker stats`
5. **Use separate services** - Don't use monolith in production

---

Need help? Check the [troubleshooting guide](../docs/DOCKER_QUICK_START.md#troubleshooting)
