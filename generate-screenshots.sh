#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGES_DIR="$ROOT_DIR/images"
SOURCE_IMAGE="$IMAGES_DIR/screenshot.png"
TEMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

if ! command -v sips >/dev/null 2>&1; then
  echo "Error: 'sips' command is required but was not found." >&2
  exit 1
fi

if [[ ! -f "$SOURCE_IMAGE" ]]; then
  echo "Error: source image not found: $SOURCE_IMAGE" >&2
  exit 1
fi

SOURCE_WIDTH="$(sips -g pixelWidth "$SOURCE_IMAGE" | awk '/pixelWidth:/ {print $2}')"
SOURCE_HEIGHT="$(sips -g pixelHeight "$SOURCE_IMAGE" | awk '/pixelHeight:/ {print $2}')"

if [[ -z "$SOURCE_WIDTH" || -z "$SOURCE_HEIGHT" ]]; then
  echo "Error: failed to read source image size." >&2
  exit 1
fi

generate_image() {
  local canvas_width="$1"
  local canvas_height="$2"
  local target_image="$IMAGES_DIR/screenshot-${canvas_width}x${canvas_height}.png"
  local working_image="$TEMP_DIR/working-${canvas_width}x${canvas_height}.png"
  local resized_width
  local resized_height

  read -r resized_width resized_height < <(
    awk -v sw="$SOURCE_WIDTH" -v sh="$SOURCE_HEIGHT" -v cw="$canvas_width" -v ch="$canvas_height" '
      BEGIN {
        scale = (cw / sw < ch / sh) ? cw / sw : ch / sh
        rw = int(sw * scale + 0.5)
        rh = int(sh * scale + 0.5)
        if (rw < 1) rw = 1
        if (rh < 1) rh = 1
        print rw, rh
      }
    '
  )

  cp "$SOURCE_IMAGE" "$working_image"
  sips --resampleHeightWidth "$resized_height" "$resized_width" "$working_image" >/dev/null
  sips --padToHeightWidth "$canvas_height" "$canvas_width" --padColor FFFFFF "$working_image" >/dev/null
  cp "$working_image" "$target_image"

  echo "Created $target_image (${canvas_width}x${canvas_height} canvas)"
}

generate_image 440 280
generate_image 640 400
