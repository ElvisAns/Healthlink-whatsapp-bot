#!/bin/bash

# HealthLink WhatsApp Bot - Production Startup Script
# This script starts both services in the correct order

set -e

echo "🚀 Starting HealthLink WhatsApp Bot Services..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please do not run this script as root"
    echo "   Run as the whatsapp-bot user instead"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "main.js" ] || [ ! -f "semantic_server.py" ]; then
    echo "❌ Please run this script from the bot directory"
    echo "   Expected files: main.js, semantic_server.py"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    echo "   Copy config.env.example to .env and configure it"
    exit 1
fi

# Check if Python dependencies are installed
if ! python3 -c "import sklearn, numpy" 2>/dev/null; then
    echo "❌ Python dependencies not installed"
    echo "   Run: pip3 install -r requirements.txt"
    exit 1
fi

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "❌ Node.js dependencies not installed"
    echo "   Run: npm install"
    exit 1
fi

# Start semantic server first
echo "📡 Starting semantic search server..."
python3 semantic_server.py 8000 &
SEMANTIC_PID=$!

# Wait for semantic server to start
echo "⏳ Waiting for semantic server to start..."
sleep 3

# Check if semantic server is running
if ! curl -s "http://127.0.0.1:8000/?q=test" > /dev/null; then
    echo "❌ Semantic server failed to start"
    kill $SEMANTIC_PID 2>/dev/null
    exit 1
fi

echo "✅ Semantic server started successfully"

# Start WhatsApp bot
echo "🤖 Starting WhatsApp bot..."
node main.js &
BOT_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BOT_PID 2>/dev/null || true
    kill $SEMANTIC_PID 2>/dev/null || true
    wait
    echo "✅ Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo ""
echo "✅ Both services are running!"
echo "   Semantic Server PID: $SEMANTIC_PID"
echo "   WhatsApp Bot PID: $BOT_PID"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for processes
wait
