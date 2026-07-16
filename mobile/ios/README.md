# iOS shell — SwiftUI (scaffold)

Native SwiftUI app calling the Rust core via `FinancialPlannerCore.xcframework` (built on macOS).

## Locked decisions

| # | Choice |
|---|--------|
| 2 | Native UI (SwiftUI) |
| 3 | MVP — Loan / India |
| 4 | Persist last inputs (UserDefaults) |
| 5 | **Scaffold only** — build on Mac with Xcode |
| 6 | Keep Capacitor `android/` WebView shell alongside |
| 7 | Offline-only, no analytics |

## Files

```
ios/FinancialPlanner/
├── FinancialPlannerApp.swift   # @main entry
├── LoanView.swift              # MVP loan form
└── LoanInputStore.swift        # UserDefaults + NativeCore stub
```

## Create Xcode project (on Mac)

1. File → New → App → SwiftUI, bundle ID `com.eswar.financialplanner.mobile`
2. Add the three Swift files above (replace generated content)
3. Build Rust xcframework:

```bash
cd mobile
rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios
cargo build --release --target aarch64-apple-ios -p financial-planner-core
# Package with xcodebuild / scripts/build-ios-core.sh (TODO)
```

4. Link `financial_planner_core.h` and replace `NativeCore` stub with C FFI calls

## Note

`LoanInputStore.swift` includes a temporary EMI helper so the UI previews work without the xcframework. Remove once FFI is wired.
