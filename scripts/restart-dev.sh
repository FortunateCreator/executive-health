#!/usr/bin/env bash
# restart-dev.sh — Kill any existing process on :3000 and start fresh
set -e

PORT=3000
DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🔍 Checking port $PORT..."
PID=$(lsof -ti:$PORT 2>/dev/null || true)
if [ -n "$PID" ]; then
  echo "🔫 Killing old process on :$PORT (PID $PID)..."
  kill "$PID" 2>/dev/null || true
  sleep 2
  # Force kill if still alive
  if lsof -ti:$PORT >/dev/null 2>&1; then
    kill -9 "$PID" 2>/dev/null || true
    sleep 1
  fi
  echo "✅ Port $PORT cleared"
fi

# Also clean the .next/server directory to avoid stale cache issues
echo "🧹 Cleaning .next build cache..."
rm -rf "$DIR/apps/web/.next/server" 2>/dev/null

echo "🚀 Starting Next.js dev server on :$PORT..."
cd "$DIR/apps/web" && exec npx next dev -p "$PORT"
