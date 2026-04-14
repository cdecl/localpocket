#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$ROOT_DIR/dist"
STAGING_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$STAGING_DIR"
}

trap cleanup EXIT

if ! command -v zip >/dev/null 2>&1; then
  echo "Error: 'zip' command is required but was not found." >&2
  exit 1
fi

MANIFEST_PATH="$ROOT_DIR/manifest.json"

if [[ ! -f "$MANIFEST_PATH" ]]; then
  echo "Error: manifest.json not found at $MANIFEST_PATH" >&2
  exit 1
fi

EXTENSION_NAME="$(
  sed -n 's/.*"name":[[:space:]]*"\([^"]*\)".*/\1/p' "$MANIFEST_PATH" | head -n 1
)"
EXTENSION_VERSION="$(
  sed -n 's/.*"version":[[:space:]]*"\([^"]*\)".*/\1/p' "$MANIFEST_PATH" | head -n 1
)"

if [[ -z "$EXTENSION_NAME" || -z "$EXTENSION_VERSION" ]]; then
  echo "Error: failed to read name/version from manifest.json" >&2
  exit 1
fi

SLUG_NAME="$(
  printf '%s' "$EXTENSION_NAME" \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[^a-z0-9]/-/g; s/-\{2,\}/-/g; s/^-//; s/-$//'
)"

ARCHIVE_BASENAME="${SLUG_NAME:-chrome-extension}-v${EXTENSION_VERSION}"
ARCHIVE_PATH="$DIST_DIR/$ARCHIVE_BASENAME.zip"

mkdir -p "$DIST_DIR"
rm -f "$ARCHIVE_PATH"

FILES_TO_PACKAGE=(
  "manifest.json"
  "popup.html"
  "popup.js"
  "style.css"
  "icon.png"
)

DIRECTORIES_TO_PACKAGE=(
  "images"
  "lib"
)

for relative_path in "${FILES_TO_PACKAGE[@]}"; do
  source_path="$ROOT_DIR/$relative_path"
  if [[ ! -f "$source_path" ]]; then
    echo "Error: required file is missing: $relative_path" >&2
    exit 1
  fi
  cp "$source_path" "$STAGING_DIR/$relative_path"
done

for relative_path in "${DIRECTORIES_TO_PACKAGE[@]}"; do
  source_path="$ROOT_DIR/$relative_path"
  if [[ ! -d "$source_path" ]]; then
    echo "Error: required directory is missing: $relative_path" >&2
    exit 1
  fi
  cp -R "$source_path" "$STAGING_DIR/$relative_path"
done

(
  cd "$STAGING_DIR"
  zip -qr "$ARCHIVE_PATH" .
)

echo "Created $ARCHIVE_PATH"
