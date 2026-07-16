package com.eswar.financialplanner.mobile.core

data class LoanInputs(
    val principalInr: Double = 5_000_000.0,
    val annualInterestRate: Double = 7.9,
    val tenureMonths: Int = 168,
)

data class LoanTotals(
    val emiInr: Double,
    val totalInterestInr: Double,
    val totalPaidInr: Double,
    val payoffMonth: Int,
)

data class LoanSummary(
    val inputs: LoanInputs,
    val totals: LoanTotals?,
    val error: String? = null,
)

fun computeLoanSummary(inputs: LoanInputs): LoanSummary {
    return try {
        val emi = NativeCore.computeBaselineEmi(
            inputs.principalInr,
            inputs.annualInterestRate,
            inputs.tenureMonths,
        )
        if (emi <= 0.0) {
            return LoanSummary(inputs, null, "Invalid loan inputs")
        }
        val json = NativeCore.baselineScheduleJson(
            inputs.principalInr,
            inputs.annualInterestRate,
            inputs.tenureMonths,
        )
        val totals = parseTotals(json)
        LoanSummary(
            inputs = inputs,
            totals = LoanTotals(
                emiInr = emi,
                totalInterestInr = totals.totalInterest,
                totalPaidInr = totals.totalPaid,
                payoffMonth = totals.payoffMonth,
            ),
        )
    } catch (e: UnsatisfiedLinkError) {
        LoanSummary(
            inputs = inputs,
            totals = null,
            error = "Native core not loaded. Run mobile/scripts/build-android-core.sh",
        )
    } catch (e: Exception) {
        LoanSummary(inputs, null, e.message)
    }
}

private data class ParsedTotals(
    val totalInterest: Double,
    val totalPaid: Double,
    val payoffMonth: Int,
)

private fun parseTotals(json: String): ParsedTotals {
    val interestRegex = """"total_interest_inr"\s*:\s*([0-9.]+)""".toRegex()
    val paidRegex = """"total_paid_inr"\s*:\s*([0-9.]+)""".toRegex()
    val payoffRegex = """"payoff_month"\s*:\s*([0-9]+)""".toRegex()
    return ParsedTotals(
        totalInterest = interestRegex.find(json)?.groupValues?.get(1)?.toDouble()
            ?: error("missing total_interest_inr"),
        totalPaid = paidRegex.find(json)?.groupValues?.get(1)?.toDouble()
            ?: error("missing total_paid_inr"),
        payoffMonth = payoffRegex.find(json)?.groupValues?.get(1)?.toInt()
            ?: error("missing payoff_month"),
    )
}
