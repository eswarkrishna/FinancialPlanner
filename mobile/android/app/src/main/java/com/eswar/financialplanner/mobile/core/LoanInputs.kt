package com.eswar.financialplanner.mobile.core

enum class PrepayPolicy {
    KEEP_EMI,
    KEEP_TENURE,
}

enum class ActiveScenario {
    BASELINE,
    PREPAY_KEEP_EMI,
    PREPAY_KEEP_TENURE,
    PF_TO_LOAN,
}

data class LoanInputs(
    val principalInr: Double = 5_000_000.0,
    val annualInterestRate: Double = 7.9,
    val tenureMonths: Int = 168,
    val prepayEnabled: Boolean = false,
    val prepayMonth: Int = 1,
    val prepayAmountInr: Double = 2_500_000.0,
    val selectedPolicy: PrepayPolicy = PrepayPolicy.KEEP_EMI,
    val pfUnemploymentEnabled: Boolean = false,
    val pfCorpusInr: Double = 2_500_000.0,
    val pfAnnualRatePct: Double = 8.25,
)

data class ScenarioTotals(
    val emiInr: Double,
    val totalInterestInr: Double,
    val totalPaidInr: Double,
    val totalPrepaymentsInr: Double,
    val payoffMonth: Int,
)

data class StrategyCompareRow(
    val id: String,
    val policyLabel: String,
    val newEmiInr: Double,
    val newTenureMonths: Int,
    val totalInterestInr: Double,
    val grossInterestSavedInr: Double,
)

data class LoanSimulation(
    val inputs: LoanInputs,
    val baseline: ScenarioTotals,
    val prepayKeepEmi: ScenarioTotals?,
    val prepayKeepTenure: ScenarioTotals?,
    val pfToLoan: ScenarioTotals?,
    val strategyCompare: List<StrategyCompareRow>,
    val activeScenario: ActiveScenario,
    val error: String? = null,
) {
    val activeTotals: ScenarioTotals
        get() = when (activeScenario) {
            ActiveScenario.BASELINE -> baseline
            ActiveScenario.PREPAY_KEEP_EMI -> prepayKeepEmi ?: baseline
            ActiveScenario.PREPAY_KEEP_TENURE -> prepayKeepTenure ?: baseline
            ActiveScenario.PF_TO_LOAN -> pfToLoan ?: baseline
        }
}
