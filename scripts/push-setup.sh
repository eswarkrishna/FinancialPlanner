#!/usr/bin/env bash
set -euo pipefail

# Run from repo root after creating the empty GitHub repository.
# Example:
#   gh repo create YOUR_USER/us-equity-research --private
#   ./scripts/push-setup.sh YOUR_USER/us-equity-research

TARGET="${1:-eswarkrishna/us-equity-research}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Run this script from the us-equity-research project root."
  exit 1
fi

git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${TARGET}.git"
git branch -M main
git push -u origin main

echo "Pushed to https://github.com/${TARGET}"
