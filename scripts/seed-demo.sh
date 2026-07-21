#!/usr/bin/env bash
set -euo pipefail
[[ "${CONFIRM_DEMO_SEED:-}" == "yes" ]] || { echo "Set CONFIRM_DEMO_SEED=yes; never run this against production." >&2; exit 2; }
[[ "${NODE_ENV:-development}" != "production" ]] || { echo "Demo seed is disabled in production." >&2; exit 2; }
cd "$(dirname "$0")/../backend" && node seed.js
