#!/bin/bash

echo "Starting HealthLink WhatsApp Bot..."
echo ""
echo "This will start two servers:"
echo "1. Python Semantic Search Server (port 8000)"
echo "2. WhatsApp Bot Server"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start Python semantic search server in background
python3 semantic_server.py 8000 &
PYTHON_PID=$!

# Wait for server to start
sleep 2

# Start the WhatsApp bot
node main.js &

# Wait for user to press Ctrl+C
wait

# Cleanup
echo "Shutting down servers..."
kill $PYTHON_PID 2>/dev/null
killall node 2>/dev/null

