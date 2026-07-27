#!/bin/zsh

set -u

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
CODEX_NODE="/Users/bosco/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
CODEX_PNPM="/Users/bosco/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm"

if command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
elif [[ -x "$CODEX_NODE" ]]; then
  NODE_BIN="$CODEX_NODE"
else
  echo "没有找到 Node.js。请先在 Codex 中打开这个项目，让 Codex 修复运行环境。"
  read "?按回车键关闭窗口。"
  exit 1
fi

if command -v pnpm >/dev/null 2>&1; then
  PNPM_BIN="$(command -v pnpm)"
elif [[ -x "$CODEX_PNPM" ]]; then
  PNPM_BIN="$CODEX_PNPM"
else
  echo "没有找到 pnpm。请先在 Codex 中打开这个项目，让 Codex修复运行环境。"
  read "?按回车键关闭窗口。"
  exit 1
fi

cd "$PROJECT_DIR"
export M365_PNPM_BIN="$PNPM_BIN"
export PATH="$(dirname "$NODE_BIN"):$PATH"
"$NODE_BIN" admin/server.mjs

echo
echo "本地内容后台已经停止。"
read "?按回车键关闭窗口。"
