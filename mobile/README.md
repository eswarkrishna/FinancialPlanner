# FinancialPlanner — Mobile (Android & iOS)

Native mobile rewrite in a **separate folder** from the web SPA. The web app (`/`) and Capacitor shell (`/android`) are unchanged.

## Architecture (locked)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Shared core | **Rust native library** (`core/financial-planner-core`) |
| 2 | UI | **Native** — Jetpack Compose (Android) + SwiftUI (iOS) |
| 3 | Scope | **MVP** — Loan tab, India locale |
| 4 | Storage | **Persist last inputs** — DataStore (Android) / UserDefaults (iOS) |
| 5 | iOS build | **Scaffold only** — Xcode project on Mac |
| 6 | Capacitor | **Keep both** — WebView shell + native `mobile/` |
| 7 | Analytics | **Offline-only** — no network calls |

| Layer | Technology | Role |
|-------|------------|--------|
| **Core** | Rust | Language-agnostic engine → `.so` / `.xcframework` |
| **Contract** | JSON Schema (`core/schema/`) | Stable I/O; validated against web goldens |
| **Android** | Kotlin + Compose + JNI | Thin shell in `android/` |
| **iOS** | Swift + SwiftUI | Thin shell in `ios/` (scaffold) |

**Source of truth:** `docs/SPEC.md`. Golden fixtures: `src/test/fixtures/goldens/`.

## Folder layout

```
mobile/
├── Cargo.toml
├── core/financial-planner-core/   # Rust engine + FFI + Android JNI
├── core/schema/
├── scripts/build-android-core.sh
├── android/                       # Compose app
└── ios/FinancialPlanner/          # SwiftUI scaffold
```

## Build & test (core)

```bash
cd mobile
cargo test          # 6 tests — all 3 web loan goldens + unit tests
cargo build --release
```

### Golden parity (Rust ↔ web)

| Golden | SPEC | Status |
|--------|------|--------|
| `BASE` | §4.3 baseline EMI | ✓ |
| `PREPAY_CASH_25L_TENURE` | §4.4 prepay keep tenure | ✓ |
| `UE_PF_TO_LOAN` | §4.7 PF tranches + timed prepay | ✓ |

## Android

```bash
export ANDROID_NDK_HOME=...
./scripts/build-android-core.sh
cd android && ./gradlew assembleDebug
```

See [`android/README.md`](android/README.md).

## iOS

Scaffold only — create Xcode project on Mac and link xcframework. See [`ios/README.md`](ios/README.md).

## FFI

C header: `core/financial-planner-core/include/financial_planner_core.h`  
Android JNI: `NativeCore.kt` ↔ `android_jni.rs`

## Next steps

- [ ] iOS xcframework build script + FFI wiring
- [ ] Android staged prepayments editor (multi-row §4.6)
- [ ] Expand Rust core for strategies, debt, retirement (phased)
