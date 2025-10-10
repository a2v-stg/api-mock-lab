# 🚀 Mock-Lab Deployment Guide

## Docker Deployment with Docker Compose

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo>
   cd api-mock-lab
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file** - Update these critical values:
   ```bash
   # Generate a secure secret key
   SECRET_KEY=$(openssl rand -hex 32)
   
   # Set a strong database password
   POSTGRES_PASSWORD=your_very_secure_password_here
   ```

4. **Build and start services**
   ```bash
   docker-compose up -d --build
   ```

5. **Check service status**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001
   - API Docs: http://localhost:8001/docs

### Services Overview

The Docker setup includes three services:

| Service | Container Name | Port | Description |
|---------|---------------|------|-------------|
| **db** | mocklab-db | 5432 | PostgreSQL 15 database |
| **backend** | mocklab-backend | 8001 | FastAPI application |
| **frontend** | mocklab-frontend | 3000 | Nginx serving React SPA |

### Architecture

```
┌─────────────────────────────────────────┐
│  User Browser (http://localhost:3000)  │
└─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────┐
│  Frontend Container (Nginx)             │
│  - Serves React build                   │
│  - Proxies /api, /auth, /admin, /ws    │
│    to backend                           │
└─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────┐
│  Backend Container (FastAPI)            │
│  - REST API endpoints                   │
│  - WebSocket support                    │
│  - Business logic                       │
└─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────┐
│  Database Container (PostgreSQL)        │
│  - Persistent volume                    │
│  - Data storage                         │
└─────────────────────────────────────────┘
```

### Environment Variables

#### Database
- `POSTGRES_DB` - Database name (default: `mocklab`)
- `POSTGRES_USER` - Database user (default: `mocklab`)
- `POSTGRES_PASSWORD` - Database password (**CHANGE THIS!**)
- `POSTGRES_PORT` - Host port for PostgreSQL (default: `5432`)

#### Application
- `SECRET_KEY` - Secret key for JWT/sessions (**CHANGE THIS!**)
- `DATABASE_URL` - Full database connection string
- `BACKEND_PORT` - Host port for backend (default: `8001`)
- `FRONTEND_PORT` - Host port for frontend (default: `3000`)

### Common Commands

#### Start services
```bash
# Start in background
docker-compose up -d

# Start with logs
docker-compose up

# Rebuild and start
docker-compose up -d --build
```

#### Stop services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data!)
docker-compose down -v
```

#### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

#### Check status
```bash
docker-compose ps
```

#### Restart a service
```bash
docker-compose restart backend
docker-compose restart frontend
```

#### Execute commands in containers
```bash
# Access backend shell
docker-compose exec backend bash

# Access database
docker-compose exec db psql -U mocklab -d mocklab

# Run database migrations
docker-compose exec backend alembic upgrade head
```

### Database Management

#### Backup Database
```bash
# Create backup
docker-compose exec db pg_dump -U mocklab mocklab > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use docker cp
docker-compose exec db pg_dump -U mocklab mocklab > /tmp/backup.sql
```

#### Restore Database
```bash
# Restore from backup
docker-compose exec -T db psql -U mocklab mocklab < backup.sql
```

#### Access Database Shell
```bash
docker-compose exec db psql -U mocklab -d mocklab
```

Common SQL queries:
```sql
-- List tables
\dt

-- Count users
SELECT COUNT(*) FROM users;

-- Count entities
SELECT COUNT(*) FROM entities;

-- View recent logs
SELECT * FROM request_logs ORDER BY timestamp DESC LIMIT 10;

-- Exit
\q
```

### Production Deployment

#### 1. Update Environment Variables
```bash
# .env for production
SECRET_KEY=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
FRONTEND_PORT=80  # or 443 for HTTPS
```

#### 2. Enable HTTPS (with Nginx + Let's Encrypt)

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-ssl.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
```

#### 3. Production Best Practices

**Security:**
- Change all default passwords
- Use strong `SECRET_KEY`
- Enable firewall rules
- Keep containers updated
- Use secrets management (Docker secrets, Vault)

**Performance:**
- Add Redis for caching
- Use connection pooling
- Configure Nginx caching
- Set up CDN for static assets

**Monitoring:**
- Add health check endpoints
- Set up logging (ELK stack)
- Monitor container resources
- Set up alerts

**Backup:**
- Automated database backups
- Volume backups
- Disaster recovery plan

### Scaling

#### Horizontal Scaling (Multiple Backend Instances)

```yaml
# docker-compose.scale.yml
services:
  backend:
    # ... existing config
    deploy:
      replicas: 3
      
  nginx-lb:
    image: nginx:alpine
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
```

Run with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d --scale backend=3
```

### Troubleshooting

#### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait for health check
# 2. Port already in use - change BACKEND_PORT in .env
# 3. Database connection error - check DATABASE_URL
```

#### Frontend shows 502 Bad Gateway
```bash
# Check if backend is running
docker-compose ps

# Check backend health
curl http://localhost:8001/health

# Restart frontend
docker-compose restart frontend
```

#### Database connection errors
```bash
# Check database status
docker-compose exec db pg_isready -U mocklab

# Check connection string
echo $DATABASE_URL

# Restart database
docker-compose restart db
```

#### Clear all data and restart fresh
```bash
# WARNING: This deletes all data!
docker-compose down -v
docker-compose up -d --build
```

### Performance Tuning

#### PostgreSQL
```bash
# Increase shared_buffers for better performance
docker-compose exec db psql -U mocklab -c "ALTER SYSTEM SET shared_buffers = '256MB';"
docker-compose restart db
```

#### Backend Workers
Update `Dockerfile.backend`:
```dockerfile
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "4"]
```

#### Nginx Caching
Add to `nginx.conf`:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;
```

### Monitoring

#### Check Container Resources
```bash
docker stats
```

#### Health Checks
```bash
# Backend
curl http://localhost:8001/health

# Frontend
curl http://localhost:3000/

# Database
docker-compose exec db pg_isready -U mocklab
```

### Migration from SQLite to PostgreSQL

If you have existing SQLite data:

```bash
# 1. Export SQLite data
sqlite3 mocker.db .dump > sqlite_dump.sql

# 2. Convert to PostgreSQL format (manual editing required)
# Edit sqlite_dump.sql to be PostgreSQL compatible

# 3. Import to PostgreSQL
docker-compose exec -T db psql -U mocklab mocklab < sqlite_dump.sql
```

### Updates and Maintenance

```bash
# Update containers
docker-compose pull
docker-compose up -d --build

# Prune unused images
docker image prune -a

# Prune unused volumes (careful!)
docker volume prune
```

### Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review configuration: `.env`, `docker-compose.yml`
- Consult main README.md and FEATURES.md
- Open a GitHub issue

---

**Ready to deploy!** 🚀

Start with: `docker-compose up -d --build`
