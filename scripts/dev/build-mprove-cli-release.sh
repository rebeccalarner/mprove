#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
MCLI_DIR="$ROOT_DIR/mcli"
RELEASE_DIR="$ROOT_DIR/mprove_data/mcli-release"
WORK_DIR="$RELEASE_DIR/work"

VERSION=""
RUN_INSTALL=0

usage() {
  cat <<'EOF'
Usage: scripts/dev/build-mprove-cli-release.sh [version] [--install]

Builds mprove CLI release files for manual GitHub release upload.

Arguments:
  version      Optional version. Defaults to package.json version. A cli- prefix is stripped.

Options:
  --install   Run pnpm install --frozen-lockfile and bun install before building.
  -h, --help  Show this help.

Outputs:
  mprove_data/mcli-release/mprove-cli-<version>-darwin-amd64.tar.gz
  mprove_data/mcli-release/mprove-cli-<version>-darwin-arm64.tar.gz
  mprove_data/mcli-release/mprove-cli-<version>-linux-amd64.tar.gz
  mprove_data/mcli-release/mprove-cli-<version>-windows-amd64.zip
  mprove_data/mcli-release/mprove-cli-<version>-checksums.txt
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --install)
      RUN_INSTALL=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [ -n "$VERSION" ]; then
        echo "Error: unexpected argument: $1"
        usage
        exit 1
      fi
      VERSION="$1"
      ;;
  esac
  shift
done

need_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Error: required command not found: $command_name"
    exit 1
  fi
}

need_command bun
need_command node
need_command tar
need_command zip
need_command sha256sum

if [ -z "$VERSION" ]; then
  VERSION="$(cd "$ROOT_DIR" && node -e "console.log(require('./package.json').version)")"
fi

VERSION="${VERSION#cli-}"

if [ -z "$VERSION" ]; then
  echo "Error: version is empty"
  exit 1
fi

if [ "$RUN_INSTALL" -eq 1 ]; then
  need_command pnpm
  echo "Installing top dependencies..."
  pnpm install --frozen-lockfile

  echo "Installing mcli dependencies..."
  (cd "$MCLI_DIR" && bun install)
fi

rm -rf "$RELEASE_DIR"
mkdir -p "$WORK_DIR" "$RELEASE_DIR"

build_unix() {
  local os="$1"
  local arch="$2"
  local bun_target="$3"
  local target_dir="$WORK_DIR/$os-$arch"
  local artifact_name="mprove-cli-$VERSION-$os-$arch.tar.gz"

  mkdir -p "$target_dir"

  echo "Building $os-$arch..."
  (cd "$MCLI_DIR" && bun build src/main.ts --compile --target="$bun_target" --outfile "$target_dir/mprove")

  if [ "$os" = "linux" ] && [ "$arch" = "amd64" ]; then
    echo "Verifying $os-$arch binary..."
    "$target_dir/mprove" version
  fi

  echo "Creating $artifact_name..."
  tar czf "$RELEASE_DIR/$artifact_name" -C "$target_dir" mprove
}

build_windows() {
  local target_dir="$WORK_DIR/windows-amd64"
  local artifact_name="mprove-cli-$VERSION-windows-amd64.zip"

  mkdir -p "$target_dir"

  echo "Building windows-amd64..."
  (cd "$MCLI_DIR" && bun build src/main.ts --compile --target=bun-windows-x64 --outfile "$target_dir/mprove.exe")

  echo "Creating $artifact_name..."
  (cd "$target_dir" && zip -q "$RELEASE_DIR/$artifact_name" mprove.exe)
}

build_unix darwin amd64 bun-darwin-x64
build_unix darwin arm64 bun-darwin-arm64
build_unix linux amd64 bun-linux-x64
build_windows

echo "Creating checksums..."
(
  cd "$RELEASE_DIR"
  sha256sum mprove-cli-"$VERSION"-* > "mprove-cli-$VERSION-checksums.txt"
)

rm -rf "$WORK_DIR"

echo "Release files are ready in: $RELEASE_DIR"
ls -la "$RELEASE_DIR"
