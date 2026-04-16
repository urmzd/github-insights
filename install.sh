#!/bin/sh
# install.sh — Installs github-insights via npm.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/urmzd/github-insights/main/install.sh | sh

set -eu

NAME="github-insights"

err() {
    echo "Error: $1" >&2
    exit 1
}

if ! command -v node >/dev/null 2>&1; then
    err "Node.js is required. Install it from https://nodejs.org"
fi

if ! command -v npm >/dev/null 2>&1; then
    err "npm is required. Install Node.js from https://nodejs.org"
fi

echo "Installing $NAME via npm..."
npm install -g "@urmzd/$NAME"
echo "Installed! Run 'github-insights --help' to get started."
