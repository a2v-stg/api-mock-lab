# Mock-Lab Root Makefile
# Convenient wrapper for deployment commands

.PHONY: help docker-help build up down restart logs logs-f clean test status db-backup db-restore db-shell dev

# Default target
help:
	@echo "Mock-Lab - Quick Commands"
	@echo "========================="
	@echo ""
	@echo "🐳 Docker Commands (Local Development):"
	@echo "  make build      - Build Docker images"
	@echo "  make up         - Start all services"
	@echo "  make down       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo "  make logs       - View logs (static)"
	@echo "  make logs-f     - Follow logs (live)"
	@echo "  make test       - Run deployment test"
	@echo "  make status     - Show service status"
	@echo ""
	@echo "🗄️  Database Commands:"
	@echo "  make db-backup  - Backup database"
	@echo "  make db-restore - Restore database (FILE=backup.sql)"
	@echo "  make db-shell   - Access database shell"
	@echo ""
	@echo "🧹 Cleanup:"
	@echo "  make clean      - Remove containers and volumes (WARNING!)"
	@echo "  make reset      - Clean and rebuild everything"
	@echo ""
	@echo "💻 Development:"
	@echo "  make dev        - Start local development (no Docker)"
	@echo ""
	@echo "📚 More Commands:"
	@echo "  make docker-help - Full Docker commands reference"
	@echo ""
	@echo "📁 Deployment Guides:"
	@echo "  Docker:     deploy/docs/DOCKER_QUICK_START.md"
	@echo "  AWS ECS:    deploy/docs/ECS_DEPLOYMENT_GUIDE.md"
	@echo "  AWS EKS:    deploy/docs/EKS_DEPLOYMENT_GUIDE.md"
	@echo "  Overview:   deploy/README.md"
	@echo ""

# Show full Docker help
docker-help:
	@cd deploy/docker && $(MAKE) help

# Docker commands - delegate to deploy/docker/Makefile
build:
	@echo "🔨 Building Docker images..."
	@cd deploy/docker && $(MAKE) build

up:
	@echo "🚀 Starting services..."
	@cd deploy/docker && $(MAKE) up
	@echo ""
	@echo "✅ Services started!"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Backend:  http://localhost:8001"

down:
	@echo "🛑 Stopping services..."
	@cd deploy/docker && $(MAKE) down

restart:
	@echo "🔄 Restarting services..."
	@cd deploy/docker && $(MAKE) restart

logs:
	@cd deploy/docker && $(MAKE) logs

logs-f:
	@cd deploy/docker && $(MAKE) logs-f

test:
	@echo "🧪 Running deployment test..."
	@cd deploy/docker && $(MAKE) test

status:
	@cd deploy/docker && $(MAKE) status

clean:
	@echo "⚠️  WARNING: This will remove all containers and volumes!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cd deploy/docker && $(MAKE) clean; \
	else \
		echo "Cancelled"; \
	fi

reset:
	@cd deploy/docker && $(MAKE) reset

# Database commands
db-backup:
	@echo "💾 Backing up database..."
	@cd deploy/docker && $(MAKE) db-backup

db-restore:
	@cd deploy/docker && $(MAKE) db-restore FILE=$(FILE)

db-shell:
	@cd deploy/docker && $(MAKE) db-shell

# Development mode (no Docker)
dev:
	@echo "🔧 Starting local development mode..."
	@echo "   Starting backend on http://localhost:8001"
	@echo "   Starting frontend on http://localhost:3000"
	@echo ""
	@echo "   Press Ctrl+C to stop"
	@echo ""
	@bash -c "trap 'kill 0' INT; ./start-backend.sh & cd frontend && npm run dev & wait"

# Quick setup for first-time users
setup:
	@echo "🎬 Setting up Mock-Lab..."
	@if [ ! -f .env ]; then \
		echo "   Creating .env file..."; \
		cp .env.example .env; \
		echo "   ✅ .env created"; \
		echo "   ⚠️  Please edit .env and update:"; \
		echo "      - POSTGRES_PASSWORD"; \
		echo "      - SECRET_KEY (generate with: openssl rand -hex 32)"; \
	else \
		echo "   ⚠️  .env already exists"; \
	fi
	@echo ""
	@echo "Next steps:"
	@echo "  1. Edit .env file with secure values"
	@echo "  2. Run: make up"
	@echo "  3. Open: http://localhost:3000"
