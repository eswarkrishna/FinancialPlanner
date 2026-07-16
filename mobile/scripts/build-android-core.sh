#!/usr/bin/env bash
# Build Rust core for Android ABIs and copy into jniLibs/.
# Requires: rustup, cargo-ndk (`cargo install cargo-ndk`), Android NDK (ANDROID_NDK_HOME).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRATE="$ROOT/core/financial-planner-core"
OUT="$ROOT/android/app/src/main/jniLibs"

if [[ -z "${ANDROID_NDK_HOME:-}" ]]; then
  echo "ANDROID_NDK_HOME is not set. Install NDK and export the path." >&2
  exit 1
fi

if ! command -v cargo-ndk >/dev/null 2>&1; then
  echo "Install cargo-ndk: cargo install cargo-ndk" >&2
  exit 1
fi

cd "$ROOT"
rustup target add aarch64-linux-android x86_64-linux-android

cargo ndk -o "$OUT" -t arm64-v8a -t x86_64 build --release -p financial-planner-core

echo "Copied libfinancial_planner_core.so to $OUT"
