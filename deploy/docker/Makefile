# Mock-Lab Makefile
# Convenient commands for Docker deployment

.PHONY: help build up down restart logs logs-f clean test status db-backup db-restore

# Default target
help:
	@echo "Mock-Lab Docker Commands"
	@echo "========================"
	@echo ""
	@echo "Setup & Deployment:"
	@echo "  make setup      - Setup .env file from template"
	@echo "  make build      - Build Docker images"
	@echo "  make up         - Start all services"
	@echo "  make down       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo ""
	@echo "Monitoring:"
	@echo "  make logs       - View all logs (static)"
	@echo "  make logs-f     - Follow all logs (live)"
	@echo "  make status     - Show service status"
	@echo ""
	@echo "Database:"
	@echo "  make db-shell   - Access database shell"
	@echo "  make db-backup  - Backup database to file"
	@echo "  make db-restore - Restore database from backup"
	@echo ""
	@echo "Testing & Cleanup:"
	@echo "  make test       - Run deployment test"
	@echo "  make clean      - Remove all containers and volumes (WARNING!)"
	@echo "  make reset      - Complete reset and rebuild"
	@echo ""

# Setup .env file
setup:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Created .env file from template"; \
		echo "⚠️  Please edit .env and update SECRET_KEY and POSTGRES_PASSWORD!"; \
	else \
		echo "⚠️  .env file already exists"; \
	fi

# Build images
build:
	@echo "🔨 Building Docker images..."
	docker-compose build

# Start services
up: setup
	@echo "🚀 Starting services..."
	docker-compose up -d
	@echo "✅ Services started"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:8001"

# Stop services
down:
	@echo "🛑 Stopping services..."
	docker-compose down
	@echo "✅ Services stopped"

# Restart services
restart:
	@echo "🔄 Restarting services..."
	docker-compose restart
	@echo "✅ Services restarted"

# View logs (static)
logs:
	docker-compose logs

# Follow logs (live)
logs-f:
	docker-compose logs -f

# Show status
status:
	@echo "📊 Service Status:"
	@docker-compose ps

# Access database shell
db-shell:
	@echo "🗄️  Accessing database shell..."
	docker-compose exec db psql -U mocklab -d mocklab

# Backup database
db-backup:
	@mkdir -p backups
	@echo "💾 Backing up database..."
	@docker-compose exec -T db pg_dump -U mocklab mocklab > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup saved to backups/"

# Restore database
db-restore:
	@if [ -z "$(FILE)" ]; then \
		echo "❌ Please specify backup file: make db-restore FILE=backups/backup.sql"; \
		exit 1; \
	fi
	@echo "📥 Restoring database from $(FILE)..."
	@docker-compose exec -T db psql -U mocklab mocklab < $(FILE)
	@echo "✅ Database restored"

# Run test script
test:
	@echo "🧪 Running deployment tests..."
	./docker-test.sh

# Clean up (removes volumes - WARNING!)
clean:
	@echo "⚠️  This will remove all containers and volumes (including data)!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "✅ Cleanup complete"; \
	else \
		echo "❌ Cancelled"; \
	fi

# Complete reset
reset: clean
	@echo "🔄 Rebuilding from scratch..."
	docker-compose up -d --build
	@echo "✅ Reset complete"

# Development mode (with SQLite)
dev:
	@echo "🔧 Starting development mode (SQLite)..."
	./start-backend.sh &
	cd frontend && npm run dev
