#!/usr/bin/env bash
# Start Next dev only if the port is free (avoids duplicate servers → RAM/CPU spikes).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-3000}"

if command -v ss >/dev/null 2>&1; then
  if ss -ltn "sport = :${PORT}" 2>/dev/null | grep -q LISTEN; then
    echo "Port ${PORT} is already in use. Stop the other process first, e.g.:"
    echo "  ss -ltnp | grep ':${PORT} '"
    echo "  # or: kill \$(lsof -t -iTCP:${PORT} -sTCP:LISTEN)"
    exit 1
  fi
elif command -v lsof >/dev/null 2>&1; then
  if lsof -iTCP:"${PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port ${PORT} is already in use. Stop the other Next dev server first."
    exit 1
  fi
fi

exec npm run dev
