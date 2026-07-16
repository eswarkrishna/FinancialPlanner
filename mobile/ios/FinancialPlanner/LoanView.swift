import SwiftUI

struct LoanView: View {
    @ObservedObject var store: LoanInputStore

    private var emi: Double {
        NativeCore.computeBaselineEmi(
            principal: store.principalInr,
            rate: store.annualRate,
            tenure: store.tenureMonths
        )
    }

    private var inr: NumberFormatter {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "INR"
        f.locale = Locale(identifier: "en_IN")
        return f
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Loan (India MVP)") {
                    TextField("Principal (INR)", value: $store.principalInr, format: .number)
                        .keyboardType(.decimalPad)
                    TextField("Annual rate (%)", value: $store.annualRate, format: .number)
                        .keyboardType(.decimalPad)
                    TextField("Tenure (months)", value: $store.tenureMonths, format: .number)
                        .keyboardType(.numberPad)
                }
                Section("Summary") {
                    Text("EMI: \(inr.string(from: NSNumber(value: emi)) ?? "—")")
                }
                Section {
                    Text("Illustrative numbers only. Not legal, tax, or EPFO advice.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Financial Planner")
        }
    }
}

#Preview {
    LoanView(store: LoanInputStore())
}
