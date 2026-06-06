#!/usr/bin/env bash
# start-dev.sh — Start the dev server, always killing any old process first
set -e
cd "$(dirname "$0")/.."

PORT=3000
PID_FILE="/tmp/executive-health-dev.pid"

# Kill previous
OLD_PID=$(cat "$PID_FILE" 2>/dev/null || true)
if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
  echo "🔫 Stopping old dev server (PID $OLD_PID)..."
  kill "$OLD_PID" 2>/dev/null
  sleep 2
fi

# Also check port directly
PORT_PID=$(lsof -ti:$PORT 2>/dev/null || true)
if [ -n "$PORT_PID" ]; then
  echo "🔫 Process on :$PORT (PID $PORT_PID)..."
  kill "$PORT_PID" 2>/dev/null
  sleep 1
  # Force if needed
  if lsof -ti:$PORT >/dev/null 2>&1; then
    kill -9 "$PORT_PID" 2>/dev/null
    sleep 1
  fi
fi

echo "🚀 Starting dev server on :$PORT..."
cd apps/web
npx next dev -p $PORT &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"
echo "✅ Dev server started (PID $NEW_PID)"
wait $NEW_PID || true

# Cleanup on exit
rm -f "$PID_FILE"
