#!/bin/bash
# Готує AI-Montazher у хмарній сесії: бібліотеки студії, браузер для рендеру, файл .env.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

kit="${CLAUDE_PROJECT_DIR:-.}/AI-Montazher"
cd "$kit/studio"

# Run the install only if a listed file has changed since the install last succeeded
hashes=node_modules/.session-start.sha256
if ! sha256sum --check --status "$hashes" 2>/dev/null; then
  rm -f "$hashes"
  npm install --no-audit --no-fund
  npx remotion browser ensure
  sha256sum ../../.claude/hooks/session-start.sh package.json package-lock.json > "$hashes" || rm -f "$hashes"
fi

# Ключ ElevenLabs береться зі змінної середовища; голос і модель — з .env.example
cd "$kit"
[ -f .env ] || cp .env.example .env
