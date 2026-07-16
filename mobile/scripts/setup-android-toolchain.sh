#!/usr/bin/env bash
# One-time Android toolchain setup: SDK command-line tools + NDK.
# Sets ANDROID_HOME / ANDROID_NDK_HOME in mobile/android/local.properties and prints shell exports.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT/android"
SDK_ROOT="${ANDROID_HOME:-$HOME/Android/Sdk}"
NDK_VERSION="${NDK_VERSION:-26.1.10909125}"
CMDLINE_TOOLS_ZIP="commandlinetools-linux-11076708_latest.zip"
CMDLINE_URL="https://dl.google.com/android/repository/${CMDLINE_TOOLS_ZIP}"

echo "==> SDK root: $SDK_ROOT"
mkdir -p "$SDK_ROOT/cmdline-tools"

if [[ ! -x "$SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" ]]; then
  echo "==> Downloading Android command-line tools"
  TMP_ZIP="$(mktemp)"
  curl -fsSL "$CMDLINE_URL" -o "$TMP_ZIP"
  rm -rf "$SDK_ROOT/cmdline-tools/latest"
  unzip -q "$TMP_ZIP" -d "$SDK_ROOT/cmdline-tools"
  mv "$SDK_ROOT/cmdline-tools/cmdline-tools" "$SDK_ROOT/cmdline-tools/latest"
  rm -f "$TMP_ZIP"
fi

export ANDROID_HOME="$SDK_ROOT"
export PATH="$SDK_ROOT/cmdline-tools/latest/bin:$SDK_ROOT/platform-tools:$PATH"

echo "==> Installing NDK $NDK_VERSION (this may take a few minutes)"
yes | sdkmanager --licenses >/dev/null 2>&1 || true
sdkmanager "platform-tools" "ndk;${NDK_VERSION}" "platforms;android-35" "build-tools;35.0.0"

NDK_HOME="$SDK_ROOT/ndk/$NDK_VERSION"
if [[ ! -d "$NDK_HOME" ]]; then
  echo "NDK not found at $NDK_HOME" >&2
  exit 1
fi

# Gradle local.properties
cat > "$ANDROID_DIR/local.properties" <<EOF
sdk.dir=$SDK_ROOT
ndk.dir=$NDK_HOME
EOF

# Shell helper (gitignored) — source before building Rust/Android
cat > "$ANDROID_DIR/env.sh" <<EOF
export ANDROID_HOME="$SDK_ROOT"
export ANDROID_NDK_HOME="$NDK_HOME"
export PATH="\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$PATH"
EOF

echo ""
echo "Android toolchain ready."
echo "  ANDROID_HOME=$SDK_ROOT"
echo "  ANDROID_NDK_HOME=$NDK_HOME"
echo ""
echo "Before building, run:"
echo "  source mobile/android/env.sh"
echo ""
echo "Or add to your shell profile:"
echo "  export ANDROID_NDK_HOME=\"$NDK_HOME\""
