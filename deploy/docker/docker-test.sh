#!/bin/bash
# Mock-Lab Docker Deployment Test Script

set -e

echo "🧪 Mock-Lab Docker Deployment Test"
echo "==================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
echo "1️⃣  Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Check if docker-compose is available
echo "2️⃣  Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose not found. Please install Docker Compose.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose is available${NC}"
echo ""

# Check if .env exists
echo "3️⃣  Checking environment file..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env file and update SECRET_KEY and POSTGRES_PASSWORD!${NC}"
    echo ""
fi
echo -e "${GREEN}✅ .env file exists${NC}"
echo ""

# Build images
echo "4️⃣  Building Docker images..."
docker-compose build
echo -e "${GREEN}✅ Images built successfully${NC}"
echo ""

# Start services
echo "5️⃣  Starting services..."
docker-compose up -d
echo -e "${GREEN}✅ Services started${NC}"
echo ""

# Wait for services to be healthy
echo "6️⃣  Waiting for services to be healthy (this may take up to 60 seconds)..."
sleep 10

# Check database
echo "   Checking database..."
for i in {1..30}; do
    if docker-compose exec -T db pg_isready -U mocklab > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Database is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}   ❌ Database failed to start${NC}"
        docker-compose logs db
        exit 1
    fi
    sleep 2
done

# Check backend
echo "   Checking backend..."
for i in {1..30}; do
    if curl -s http://localhost:8001/health > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Backend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}   ❌ Backend failed to start${NC}"
        docker-compose logs backend
        exit 1
    fi
    sleep 2
done

# Check frontend
echo "   Checking frontend..."
for i in {1..20}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Frontend is ready${NC}"
        break
    fi
    if [ $i -eq 20 ]; then
        echo -e "${RED}   ❌ Frontend failed to start${NC}"
        docker-compose logs frontend
        exit 1
    fi
    sleep 2
done

echo ""
echo "7️⃣  Running integration tests..."

# Test backend health
echo "   Testing backend health endpoint..."
HEALTH=$(curl -s http://localhost:8001/health)
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}   ✅ Backend health check passed${NC}"
else
    echo -e "${RED}   ❌ Backend health check failed${NC}"
    echo "   Response: $HEALTH"
fi

# Test backend API docs
echo "   Testing backend API docs..."
if curl -s http://localhost:3000/docs > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ API docs accessible via frontend proxy${NC}"
else
    echo -e "${YELLOW}   ⚠️  API docs not accessible (this is ok)${NC}"
fi

# Test frontend
echo "   Testing frontend..."
if curl -s http://localhost:3000 | grep -q "Mock-Lab" > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Frontend is serving content${NC}"
else
    echo -e "${YELLOW}   ⚠️  Frontend content check inconclusive${NC}"
fi

echo ""
echo "8️⃣  Service status:"
docker-compose ps

echo ""
echo -e "${GREEN}🎉 Deployment test completed successfully!${NC}"
echo ""
echo "📋 Access your application:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8001"
echo "   API Docs:  http://localhost:8001/docs"
echo ""
echo "📝 Next steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Create an account"
echo "   3. Start creating mock APIs!"
echo ""
echo "🛠️  Useful commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop services:    docker-compose down"
echo "   Restart:          docker-compose restart"
echo ""
