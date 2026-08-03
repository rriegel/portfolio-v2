#!/bin/bash
# Package Lambda function into a zip for deployment
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ZIP_PATH="${SCRIPT_DIR}/lambda.zip"

rm -f "$ZIP_PATH"
cd "$SCRIPT_DIR"
zip -j "$ZIP_PATH" contact_handler.py
echo "Created $ZIP_PATH ($(du -h "$ZIP_PATH" | cut -f1))"
