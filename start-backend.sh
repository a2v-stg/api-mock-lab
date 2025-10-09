#!/bin/bash

echo "🚀 Starting API Mocker Backend..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -q -r requirements.txt

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cat > .env << EOF
DATABASE_URL=sqlite:///./mocker.db
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
EOF
fi

echo ""
echo "✅ Backend is ready!"
echo "📖 API Documentation: http://localhost:8001/docs"
echo "🔗 Backend API: http://localhost:8001"
echo ""

# Start the server
uvicorn backend.main:app --reload --port 8001
