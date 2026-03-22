#!/usr/bin/env bash
set -euo pipefail

START_TIME=$(date +%s)
FAILURES=()
SERVE_PORT=8030

step() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "▶ $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; FAILURES+=("$1"); }

cleanup() {
  lsof -ti:$SERVE_PORT | xargs kill 2>/dev/null || true
}
trap cleanup EXIT

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

wait_for_server() {
  local url="$1"
  local max_attempts=30
  local attempt=0
  while [ $attempt -lt $max_attempts ]; do
    if curl -sf "$url" > /dev/null 2>&1; then
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 1
  done
  return 1
}

# ── Step 1: Code quality checks ──

step "Step 1/5: Code quality checks"
if (cd "$ROOT_DIR" && pnpm run check); then
  pass "Code quality checks passed"
else
  fail "Code quality checks"
fi

# ── Step 2: Clean and build ──

step "Step 2/5: Clean build"
if (cd "$ROOT_DIR" && pnpm run clean && pnpm run build); then
  pass "Clean build passed"
else
  fail "Clean build"
fi

# ── Step 3: Start production server ──

step "Step 3/5: Start production server"
cleanup
(cd "$ROOT_DIR" && pnpm dlx serve out -l $SERVE_PORT --no-clipboard) &

# ── Step 4: Wait for server ──

step "Step 4/5: Wait for server"
if wait_for_server "http://localhost:$SERVE_PORT/manuals/"; then
  pass "Production server ready on port $SERVE_PORT"
else
  fail "Production server failed to start within 30s"
fi

# ── Step 5: Smoke tests ──

step "Step 5/5: Smoke tests"
if (cd "$ROOT_DIR" && BASE_URL="http://localhost:$SERVE_PORT" node scripts/test-all-pages-fast.js); then
  pass "Smoke tests passed"
else
  fail "Smoke tests"
fi

# ── Summary ──

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SUMMARY (${DURATION}s)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ${#FAILURES[@]} -eq 0 ]; then
  echo "✅ All checks passed! Safe to push."
  exit 0
else
  echo "❌ ${#FAILURES[@]} check(s) failed:"
  for f in "${FAILURES[@]}"; do
    echo "   - $f"
  done
  exit 1
fi
