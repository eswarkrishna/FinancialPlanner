import SwiftUI

@main
struct FinancialPlannerApp: App {
    @StateObject private var store = LoanInputStore()

    var body: some Scene {
        WindowGroup {
            LoanView(store: store)
        }
    }
}
