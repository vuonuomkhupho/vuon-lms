#!/bin/bash
set -e

# Build a custom Frappe image with LMS + DFP External Storage baked in.
# This uses the official frappe_docker Containerfile.
#
# Usage:
#   ./scripts/build-image.sh [tag]
#
# Example:
#   ./scripts/build-image.sh vuon-lms:latest

TAG="${1:-vuon-lms:latest}"
FRAPPE_BRANCH="version-15"
PYTHON_VERSION="3.11.9"
NODE_VERSION="18.20.2"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Encode apps.json as base64
APPS_JSON_BASE64=$(base64 -w 0 < "$PROJECT_DIR/apps.json")

# Clone frappe_docker if not present (needed for the Containerfile)
FRAPPE_DOCKER_DIR="$PROJECT_DIR/.frappe_docker"
if [ ! -d "$FRAPPE_DOCKER_DIR" ]; then
  echo "Cloning frappe_docker..."
  git clone --depth 1 https://github.com/frappe/frappe_docker "$FRAPPE_DOCKER_DIR"
fi

echo "Building custom image: $TAG"
echo "Apps: $(cat "$PROJECT_DIR/apps.json")"

docker build \
  --build-arg="APPS_JSON_BASE64=$APPS_JSON_BASE64" \
  --build-arg="FRAPPE_PATH=https://github.com/frappe/frappe" \
  --build-arg="FRAPPE_BRANCH=$FRAPPE_BRANCH" \
  --build-arg="PYTHON_VERSION=$PYTHON_VERSION" \
  --build-arg="NODE_VERSION=$NODE_VERSION" \
  --tag="$TAG" \
  --file="$FRAPPE_DOCKER_DIR/images/custom/Containerfile" \
  "$FRAPPE_DOCKER_DIR"

echo ""
echo "Image built successfully: $TAG"
echo ""
echo "Next steps:"
echo "  1. Update CUSTOM_IMAGE in .env to: $TAG"
echo "  2. Run: docker compose up -d"
