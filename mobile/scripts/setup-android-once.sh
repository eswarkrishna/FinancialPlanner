#!/usr/bin/env bash
# One-time Android deploy setup: toolchain + signing keystore + Rust targets.
# Safe to re-run (skips steps already done).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT/android"
KEYSTORE="$ANDROID_DIR/financial-planner-mobile.keystore"
PROPS="$ANDROID_DIR/keystore.properties"
STORE_PASS="${FP_KEYSTORE_PASSWORD:-fp-mobile-store-2026}"

echo "==> FinancialPlanner mobile — one-time Android setup"
echo ""

# 1. Rust Android targets + cargo-ndk
if ! rustup target list --installed | grep -q aarch64-linux-android; then
  rustup target add aarch64-linux-android x86_64-linux-android
fi
if ! command -v cargo-ndk >/dev/null 2>&1; then
  echo "==> Installing cargo-ndk (v2.12.7 for Rust 1.83+)"
  cargo install cargo-ndk --version 2.12.7
fi

# 2. Android SDK + NDK
if [[ ! -f "$ANDROID_DIR/env.sh" ]]; then
  "$ROOT/scripts/setup-android-toolchain.sh"
else
  echo "==> Android toolchain already configured (env.sh exists)"
fi

# 3. Signing keystore
if [[ ! -f "$KEYSTORE" ]]; then
  echo "==> Generating release keystore: $KEYSTORE"
  keytool -genkey -v \
    -keystore "$KEYSTORE" \
    -alias financial-planner \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$STORE_PASS" \
    -keypass "$STORE_PASS" \
    -dname "CN=Financial Planner Mobile, OU=Engineering, O=FinancialPlanner, L=Bengaluru, ST=KA, C=IN"
else
  echo "==> Keystore already exists: $KEYSTORE"
fi

if [[ ! -f "$PROPS" ]]; then
  echo "==> Writing keystore.properties"
  cat > "$PROPS" <<EOF
storeFile=$KEYSTORE
storePassword=$STORE_PASS
keyAlias=financial-planner
keyPassword=$STORE_PASS
EOF
fi

if [[ ! -f "$ANDROID_DIR/signing.local.md" ]]; then
  cat > "$ANDROID_DIR/signing.local.md" <<EOF
# Local signing credentials (gitignored)

| Field | Value |
|-------|--------|
| Keystore | \`financial-planner-mobile.keystore\` |
| Alias | \`financial-planner\` |
| Password | \`$STORE_PASS\` (store + key, PKCS12) |

**Back up the keystore file** before deleting this environment. Losing it blocks Play Store updates for the same app.

Build release: \`source mobile/android/env.sh && mobile/scripts/build-android-release.sh\`
EOF
fi

echo ""
echo "Setup complete."
echo ""
echo "  source mobile/android/env.sh"
echo "  mobile/scripts/build-android-release.sh          # Play Store .aab"
echo "  mobile/scripts/build-android-release.sh --apk    # sideload .apk"
echo ""
echo "Credentials: mobile/android/signing.local.md (gitignored)"
echo "BACK UP: mobile/android/financial-planner-mobile.keystore"
