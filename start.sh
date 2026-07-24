#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")" && pwd)"
cd "$project_dir"
[[ -f .env ]] || { echo "Missing .env; copy .env.example and configure it." >&2; exit 1; }
[[ -d backend/node_modules && -d frontend/node_modules ]] || { echo "Dependencies missing; run scripts/bootstrap.sh." >&2; exit 1; }
set -a; source .env; set +a
: "${OPENROUTER_API_KEY:?OPENROUTER_API_KEY is required}" "${OPENROUTER_MODEL:?OPENROUTER_MODEL is required}"
[[ "${OPENROUTER_BASE_URL:-${OPENAI_BASE_URL:-}}" == "https://openrouter.ai/api/v1" ]] || { echo 'OPENROUTER_BASE_URL must be https://openrouter.ai/api/v1.' >&2; exit 1; }
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do if lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then echo "Port $port is occupied." >&2; exit 1; fi; done
if [ "${MIGRATE_ON_START:-false}" = true ]; then
  case "${ALLOW_SCHEMA_MIGRATION:-}" in 1|true) ;; *) echo 'Explicit schema migration acknowledgement is required.' >&2; exit 1;; esac
  bash ./scripts/migrate.sh
  node backend/scripts/create-admin.js
fi
(cd backend && CLIENT_URL="http://127.0.0.1:$FRONTEND_PORT" npm start) & backend_pid=$!
(cd frontend && BROWSER=none PORT="${FRONTEND_PORT:-3001}" REACT_APP_API_URL="http://127.0.0.1:$BACKEND_PORT/api" npm start) & frontend_pid=$!
cleanup() { kill "$backend_pid" "$frontend_pid" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
wait "$backend_pid" "$frontend_pid"
