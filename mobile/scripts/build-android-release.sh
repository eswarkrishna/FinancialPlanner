#!/usr/bin/env bash
# Build signed release artifacts for Google Play or sideloading.
# Requires: keystore.properties, ANDROID_NDK_HOME, cargo-ndk (see build-android-core.sh).
#
# Usage:
#   mobile/scripts/build-android-release.sh          # Play Store AAB (default)
#   mobile/scripts/build-android-release.sh --apk    # Signed APK for sideload / testers
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT/android"
KEYSTORE_PROPS="$ANDROID_DIR/keystore.properties"
FORMAT="aab"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apk) FORMAT="apk"; shift ;;
    -h|--help)
      echo "Usage: $0 [--apk]"
      echo "  (default) bundleRelease → app-release.aab for Google Play"
      echo "  --apk     assembleRelease → app-release.apk for sideloading"
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ ! -f "$KEYSTORE_PROPS" ]]; then
  echo "Missing $KEYSTORE_PROPS" >&2
  echo "Copy keystore.properties.example → keystore.properties and set signing paths." >&2
  exit 1
fi

echo "==> Building Rust native libs (release)"
"$ROOT/scripts/build-android-core.sh"

echo "==> Building Android release ($FORMAT)"
cd "$ANDROID_DIR"
if [[ "$FORMAT" == "apk" ]]; then
  ./gradlew assembleRelease
  OUT="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
else
  ./gradlew bundleRelease
  OUT="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
fi

echo ""
echo "Release artifact ready:"
echo "  $OUT"
echo ""
echo "Google Play: upload the .aab in Play Console → Release → Production (or Internal testing)."
