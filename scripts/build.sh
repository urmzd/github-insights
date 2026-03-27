#!/usr/bin/env bash
set -euo pipefail

VERSION=$(node -p "require('./package.json').version")

echo "Building action bundle..."
ncc build src/action.ts -o dist --source-map --license licenses.txt -t

echo "Building CLI bundle..."
ncc build src/cli.tsx -o dist-cli --source-map --license licenses.txt -t

# Prepend shebang to CLI entry point
CLI=dist-cli/index.js
{ echo '#!/usr/bin/env node'; cat "$CLI"; } > "$CLI.tmp" && mv "$CLI.tmp" "$CLI"
chmod +x "$CLI"

echo "Done. (v$VERSION)"
