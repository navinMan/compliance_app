#!/usr/bin/env bash
# Updated dev-worker runner to use node scripts/worker.js
set -e
echo "Starting AgentGuard dev worker (DB-backed queue fallback)..."
node scripts/worker.js
