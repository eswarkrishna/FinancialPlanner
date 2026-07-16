import Foundation

/// Persists last loan inputs (UserDefaults). Offline-only MVP.
@MainActor
final class LoanInputStore: ObservableObject {
    @Published var principalInr: Double {
        didSet { UserDefaults.standard.set(principalInr, forKey: Keys.principal) }
    }
    @Published var annualRate: Double {
        didSet { UserDefaults.standard.set(annualRate, forKey: Keys.rate) }
    }
    @Published var tenureMonths: Int {
        didSet { UserDefaults.standard.set(tenureMonths, forKey: Keys.tenure) }
    }

    private enum Keys {
        static let principal = "principal_inr"
        static let rate = "annual_interest_rate"
        static let tenure = "tenure_months"
    }

    init() {
        let defaults = UserDefaults.standard
        principalInr = defaults.object(forKey: Keys.principal) as? Double ?? 5_000_000
        annualRate = defaults.object(forKey: Keys.rate) as? Double ?? 7.9
        tenureMonths = defaults.object(forKey: Keys.tenure) as? Int ?? 168
    }
}

struct LoanTotals {
    let emiInr: Double
    let totalInterestInr: Double
    let totalPaidInr: Double
    let payoffMonth: Int
}

enum NativeCore {
    /// Calls Rust `FinancialPlannerCore.xcframework` when linked.
    static func computeBaselineEmi(principal: Double, rate: Double, tenure: Int) -> Double {
        // Placeholder until xcframework is built on macOS.
        // Replace with C FFI: fp_compute_baseline_emi(...)
        guard principal > 0, tenure > 0, rate >= 0 else { return 0 }
        let r = rate / 100.0 / 12.0
        if r == 0 { return (principal / Double(tenure) * 100).rounded() / 100 }
        let pow = pow(1 + r, Double(tenure))
        let emi = principal * r * pow / (pow - 1)
        return (emi * 100).rounded() / 100
    }
}
