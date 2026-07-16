# Android shell — Jetpack Compose

Native Compose UI for the India loan MVP. Loads `libfinancial_planner_core.so` from the Rust crate via JNI.

Package: `com.eswar.financialplanner.mobile` (separate from the Capacitor WebView app `com.eswar.financialplanner`).

## Prerequisites

| Tool | Install |
|------|---------|
| Android Studio + SDK 35 | [developer.android.com/studio](https://developer.android.com/studio) |
| Android NDK | SDK Manager → SDK Tools → NDK |
| Rust | `rustup` |
| cargo-ndk | `cargo install cargo-ndk` |

```bash
export ANDROID_NDK_HOME="$HOME/Android/Sdk/ndk/<version>"
rustup target add aarch64-linux-android x86_64-linux-android
```

## One-time setup (automated)

```bash
./mobile/scripts/setup-android-once.sh
source mobile/android/env.sh
```

This installs the Android NDK, creates `financial-planner-mobile.keystore` + `keystore.properties`, and installs `cargo-ndk`. Credentials are in `signing.local.md` (gitignored).

**Back up** `mobile/android/financial-planner-mobile.keystore` — losing it blocks future Play Store updates.

Override keystore password: `FP_KEYSTORE_PASSWORD=your-secret ./mobile/scripts/setup-android-once.sh`

## Debug build (local testing)

```bash
# 1. Rust native libs
./mobile/scripts/build-android-core.sh

# 2. Debug APK
cd mobile/android
./gradlew assembleDebug

# 3. Install on device
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Release build (Google Play or sideload)

### One-time: create signing keystore

**Automated (recommended):**

```bash
./mobile/scripts/setup-android-once.sh
```

**Manual:**

```bash
keytool -genkey -v -keystore financial-planner-mobile.keystore \
  -alias financial-planner -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore file and passwords securely (never commit them).

### One-time: configure Gradle signing

```bash
cp mobile/android/keystore.properties.example mobile/android/keystore.properties
# Edit keystore.properties — use an absolute path for storeFile
```

`keystore.properties` is gitignored. After `setup-android-once.sh`, it is created automatically.

### Build signed release (one command)

**Google Play (AAB — recommended):**

```bash
./mobile/scripts/build-android-release.sh
```

Output: `mobile/android/app/build/outputs/bundle/release/app-release.aab`

**Sideload / testers (APK):**

```bash
./mobile/scripts/build-android-release.sh --apk
```

Output: `mobile/android/app/build/outputs/apk/release/app-release.apk`

The release script runs `build-android-core.sh` then `bundleRelease` / `assembleRelease`.

### Upload to Play Console

1. [Google Play Console](https://play.google.com/console) → Create app (or select existing)
2. **Release → Testing → Internal testing** (recommended first) or **Production**
3. Upload `app-release.aab`
4. Complete store listing, content rating, and **Data safety** (app is offline-only — no data collection)
5. Submit for review

Bump `versionCode` / `versionName` in `app/build.gradle.kts` before each Play Store upload.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Native core not loaded` in app | Run `build-android-core.sh` before Gradle |
| `ANDROID_NDK_HOME is not set` | Export NDK path (see above) |
| `Missing keystore.properties` | Copy `.example` → `keystore.properties` |
| Gradle SDK errors | Set `sdk.dir` in `local.properties` or open project in Android Studio |

## MVP features

- Loan inputs: principal, rate, tenure
- **One-time prepayment** — month + amount, policy compare (reduce EMI vs reduce tenure)
- **PF unemployment → loan** — SPEC §4.7 tranches at months 1 and 12
- Live totals via Rust `simulateLoanJson` JNI
- DataStore persistence (offline)
- SPEC §14 disclaimer in UI

## Module map

| Path | Role |
|------|------|
| `core/NativeCore.kt` | JNI to Rust |
| `core/LoanSimulation.kt` | Parse simulate JSON |
| `data/LoanPreferencesRepository.kt` | DataStore |
| `ui/loan/LoanScreen.kt` | Compose form + prepay UI |
