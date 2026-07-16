# iOS shell (pending)

Swift + SwiftUI UI will live here. It will link `FinancialPlannerCore.xcframework` built from the Rust crate and call the C FFI in `core/financial-planner-core/include/financial_planner_core.h`.

**Blocked on:** Decisions 2 (UI), 3 (scope), 4 (storage), 5 (Xcode / CI).

## Planned layout

```
ios/
├── FinancialPlanner/       # SwiftUI app target
├── FinancialPlannerCore/   # Swift package wrapping C FFI
└── FinancialPlanner.xcodeproj
```

## Build (future)

```bash
cd mobile/core/financial-planner-core
cargo build --release --target aarch64-apple-ios
# xcodebuild packages xcframework
```

Requires macOS with Xcode for device/simulator builds.
