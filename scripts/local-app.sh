#!/bin/sh
set -eu

workspace_node="${CODEX_WORKSPACE_NODE:-/Users/syedtabishmobin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin}"
workspace_pnpm="${CODEX_WORKSPACE_PNPM:-/Users/syedtabishmobin/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm}"
script_directory="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
project_root="$(dirname "$script_directory")"

if [ ! -x "$workspace_node/node" ]; then
  if command -v node >/dev/null 2>&1; then
    workspace_node="$(dirname "$(command -v node)")"
  else
    echo "Node.js 22 or newer is required. Install Node.js, or set CODEX_WORKSPACE_NODE to its bin directory." >&2
    exit 1
  fi
fi

if [ ! -x "$workspace_pnpm" ]; then
  workspace_pnpm="$(command -v pnpm || true)"
fi

if [ -z "$workspace_pnpm" ]; then
  echo "pnpm is required. Install pnpm, or set CODEX_WORKSPACE_PNPM to its executable." >&2
  exit 1
fi

export PATH="$workspace_node:$PATH"
export DM_PROFILE="${DM_PROFILE:-local}"
export DM_DATA_DIR="${DM_DATA_DIR:-$project_root/local-data}"
export DM_OUTBOUND_NETWORK="deny"
export DM_AI_PROVIDER="${DM_AI_PROVIDER:-local-deterministic}"
export DM_EXTERNAL_CONNECTORS="disabled"
export DM_EXTERNAL_NOTIFICATIONS="disabled"

exec "$workspace_pnpm" "${@:-dev}"
