#!/bin/bash

echo "🎨 Starting API Mocker Frontend..."
echo ""

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "✅ Frontend is ready!"
echo "🌐 Open your browser: http://localhost:3000"
echo ""

# Start the development server
npm run dev
