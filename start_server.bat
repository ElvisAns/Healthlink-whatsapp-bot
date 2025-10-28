@echo off
echo Starting HealthLink WhatsApp Bot...
echo.
echo This will start two servers:
echo 1. Python Semantic Search Server (port 8000)
echo 2. WhatsApp Bot Server
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start Python semantic search server in background
start "HealthLink Semantic Server" python semantic_server.py 8000

REM Wait a bit for the server to start
timeout /t 2 /nobreak >nul

REM Start the WhatsApp bot
node main.js

REM When user presses Ctrl+C, this script ends and both processes should terminate
pause

