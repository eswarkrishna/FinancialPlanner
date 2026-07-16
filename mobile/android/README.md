# Android shell — Jetpack Compose

Native Compose UI for the India loan MVP. Loads `libfinancial_planner_core.so` from the Rust crate via JNI.

## Build

1. **Rust native libs** (requires Android NDK):

```bash
export ANDROID_NDK_HOME=...   # e.g. $ANDROID_HOME/ndk/<version>
mobile/scripts/build-android-core.sh
```

2. **APK**:

```bash
cd mobile/android
./gradlew assembleDebug
```

Install: `android/app/build/outputs/apk/debug/app-debug.apk`

## Package

`com.eswar.financialplanner.mobile` — separate from the Capacitor WebView app (`com.eswar.financialplanner`).

## MVP features

- Loan inputs: principal, rate, tenure
- Live EMI + totals via Rust JNI
- DataStore persistence of last inputs (offline)
- SPEC §14 disclaimer in UI

## Module map

| Path | Role |
|------|------|
| `core/NativeCore.kt` | JNI to Rust |
| `core/LoanSummary.kt` | Parse schedule JSON |
| `data/LoanPreferencesRepository.kt` | DataStore |
| `ui/loan/LoanScreen.kt` | Compose form + KPI card |
