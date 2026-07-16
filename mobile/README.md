# FinancialPlanner — Mobile (Android & iOS)

Native mobile rewrite in a **separate folder** from the web SPA. The web app (`/`) is unchanged.

## Architecture (locked)

| Layer | Technology | Role |
|-------|------------|--------|
| **Core** | **Rust** (`core/financial-planner-core`) | Language-agnostic finance engine; compiled to `.so` (Android) and `.xcframework` (iOS) |
| **Contract** | JSON Schema (`core/schema/`) | Stable input/output shapes; validated against web golden fixtures |
| **Android** | Kotlin + Jetpack Compose *(pending decision)* | Thin UI shell calling core via FFI |
| **iOS** | Swift + SwiftUI *(pending decision)* | Thin UI shell calling core via FFI |

**Source of truth:** `docs/SPEC.md` (and locale variants). Golden fixtures live in `src/test/fixtures/` at repo root; mobile tests load the same JSON.

## Folder layout

```
mobile/
├── Cargo.toml                  # Rust workspace
├── core/
│   ├── financial-planner-core/ # Rust engine crate
│   ├── schema/                 # JSON Schema for I/O
│   └── fixtures/               # Symlinks to web golden JSON (read-only parity checks)
├── android/                    # Kotlin shell (scaffold pending)
└── ios/                        # Swift shell (scaffold pending)
```

## Build & test (core)

```bash
cd mobile
cargo test
cargo build --release
```

Golden parity tests compare Rust output to `src/test/fixtures/goldens/*.json`.

## FFI (planned)

The core exposes a C ABI (`fp_*` functions) for Kotlin (`JNI`) and Swift. Bindings are generated with `cbindgen`. Android packages `libfinancial_planner_core.so`; iOS ships `FinancialPlannerCore.xcframework`.

## Pending decisions

Please confirm before UI work begins:

| # | Topic | Options |
|---|--------|---------|
| 2 | **UI** | Native (Compose + SwiftUI) · Flutter · React Native |
| 3 | **Scope** | MVP (Loan / India) · Phased · Full parity |
| 4 | **Storage** | In-memory · Persist last inputs · SQLite + export |
| 5 | **iOS build** | Scaffold only · Local Mac · CI macOS runner |
| 6 | **Capacitor** | Keep `android/` WebView shell · Deprecate · Replace |
| 7 | **Analytics** | Offline-only · Opt-in GA · No network |

## Implementation phases

1. **Core (in progress)** — EMI, baseline schedule, prepayment (India); golden tests
2. **PF / cashflow** — unemployment tranches, timed prepays (`UE_PF_TO_LOAN` golden)
3. **Android shell** — Compose UI, JNI/FFI wiring
4. **iOS shell** — SwiftUI, xcframework integration
5. **Locales & tabs** — US/UK, strategies, debt, retirement, budget

## Relationship to web Capacitor shell

The repo root still has `android/` + Capacitor (WebView wrapping the React SPA). This `mobile/` tree is the **native rewrite** and does not replace Capacitor until you decide (Decision 6).
