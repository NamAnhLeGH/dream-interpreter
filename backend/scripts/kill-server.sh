#!/bin/bash
# Kill any process using ports 3000 or 8080
lsof -ti:3000,8080 | xargs kill -9 2>/dev/null

# Also kill any tsx watch processes
pkill -f "tsx watch server.ts" 2>/dev/null

echo "✅ Server processes killed (ports 3000, 8080)"

