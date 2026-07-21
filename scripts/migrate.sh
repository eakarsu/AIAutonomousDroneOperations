#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
set -a; source "$project_dir/.env"; set +a
: "${DB_NAME:?DB_NAME required}" "${DB_USER:?DB_USER required}"
for migration in "$project_dir"/backend/migrations/*.sql; do
  PGPASSWORD="${DB_PASSWORD:-}" psql -v ON_ERROR_STOP=1 -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -f "$migration"
done
