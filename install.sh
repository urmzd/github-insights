#!/usr/bin/env bash
set -euo pipefail

REPO="urmzd/github-insights"
NAME="github-insights"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"

# Detect platform
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
  x86_64)  ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
esac

echo "Installing $NAME..."

# Check for Node.js
if ! command -v node &>/dev/null; then
  echo "Error: Node.js is required. Install it from https://nodejs.org" >&2
  exit 1
fi

# Install via npm
if command -v npm &>/dev/null; then
  echo "Installing via npm..."
  npm install -g "@urmzd/$NAME"
  echo "Installed! Run 'github-insights --help' to get started."
  exit 0
fi

echo "Error: npm is required. Install Node.js from https://nodejs.org" >&2
exit 1
