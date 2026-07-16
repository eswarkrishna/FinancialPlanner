# Android shell (pending)

Kotlin + Jetpack Compose UI will live here. It will load `libfinancial_planner_core.so` from the Rust crate and call the C FFI in `core/financial-planner-core/include/financial_planner_core.h`.

**Blocked on:** Decisions 2 (UI), 3 (scope), 4 (storage), 6 (Capacitor relationship).

## Planned layout

```
android/
├── app/                 # Compose application module
├── core-bindings/       # JNI / Kotlin wrappers over fp_* FFI
└── build.gradle.kts
```

## Build (future)

```bash
cd mobile
cargo ndk -t arm64-v8a -t armeabi-v7a -t x86_64 build --release
# then Gradle assembles APK with bundled .so
```
