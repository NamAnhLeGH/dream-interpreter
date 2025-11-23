#!/bin/bash
# Kill any process using port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Also kill any tsx watch processes
pkill -f "tsx watch server.ts" 2>/dev/null

echo "✅ Server processes killed"

