#!/bin/bash
set -e

echo "======================================"
echo "🔧 Running pre-push checks"
echo "======================================"
echo

# Step 1: Kill any existing servers
echo "🔪 Killing process on port 3100..."
lsof -ti:3100 | xargs kill -9 2>/dev/null || true
echo "✅ Port cleared"
echo

# Step 2: Run code quality checks
echo "✨ Running code quality checks..."
pnpm run check
echo "✅ Code quality checks passed"
echo

# Step 3: Clean build directories
echo "🧹 Cleaning build directories..."
pnpm run clean
echo "✅ Build directories cleaned"
echo

# Step 4: Build the project
echo "🔨 Building project..."
pnpm run build
echo "✅ Project built successfully"
echo

# Step 5: Run smoke tests with production build
echo "🎭 Running smoke tests with production build..."
echo

# Start production server with serve
pnpm dlx serve out -l 3100 --no-clipboard &
SERVER_PID=$!

# Wait for server
echo "⏳ Waiting for production server..."
sleep 5

# Check if server is running
if ! curl -s http://localhost:3100 > /dev/null; then
  echo "❌ Production server failed to start"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

echo "✅ Production server ready"
echo

# Run smoke tests
echo "🧪 Running smoke tests..."
node scripts/test-all-pages-fast.js

TEST_EXIT=$?

# Kill server
echo "🛑 Stopping server..."
kill $SERVER_PID 2>/dev/null || true
lsof -ti:3100 | xargs kill -9 2>/dev/null || true

if [ $TEST_EXIT -eq 0 ]; then
  echo
  echo "======================================"
  echo "✅ All pre-push checks passed!"
  echo "======================================"
  echo
  echo "Ready to push!"
  exit 0
else
  echo
  echo "======================================"
  echo "❌ Tests failed"
  echo "======================================"
  exit 1
fi
