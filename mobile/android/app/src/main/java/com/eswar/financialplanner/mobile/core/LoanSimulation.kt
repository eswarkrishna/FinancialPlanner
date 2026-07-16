package com.eswar.financialplanner.mobile.core

import org.json.JSONArray
import org.json.JSONObject

fun computeLoanSimulation(inputs: LoanInputs): LoanSimulation {
    return try {
        val json = NativeCore.simulateLoanJson(inputs.toSimulateJson())
        if (json.contains("\"error\"")) {
            val err = JSONObject(json).optString("error", "Simulation failed")
            return LoanSimulation(
                inputs = inputs,
                baseline = emptyBaseline(),
                prepayKeepEmi = null,
                prepayKeepTenure = null,
                pfToLoan = null,
                strategyCompare = emptyList(),
                activeScenario = ActiveScenario.BASELINE,
                error = err,
            )
        }
        parseSimulation(inputs, json)
    } catch (e: UnsatisfiedLinkError) {
        LoanSimulation(
            inputs = inputs,
            baseline = emptyBaseline(),
            prepayKeepEmi = null,
            prepayKeepTenure = null,
            pfToLoan = null,
            strategyCompare = emptyList(),
            activeScenario = ActiveScenario.BASELINE,
            error = "Native core not loaded. Run mobile/scripts/build-android-core.sh",
        )
    } catch (e: Exception) {
        LoanSimulation(
            inputs = inputs,
            baseline = emptyBaseline(),
            prepayKeepEmi = null,
            prepayKeepTenure = null,
            pfToLoan = null,
            strategyCompare = emptyList(),
            activeScenario = ActiveScenario.BASELINE,
            error = e.message,
        )
    }
}

private fun emptyBaseline() = ScenarioTotals(0.0, 0.0, 0.0, 0.0, 0)

private fun LoanInputs.toSimulateJson(): String {
    val root = JSONObject()
    root.put("principal_inr", principalInr)
    root.put("annual_interest_rate", annualInterestRate)
    root.put("tenure_months", tenureMonths)
    if (prepayEnabled && prepayAmountInr > 0) {
        root.put(
            "one_time_prepay",
            JSONObject().apply {
                put("month", prepayMonth)
                put("amount_inr", prepayAmountInr)
            },
        )
    }
    if (pfUnemploymentEnabled && pfCorpusInr > 0) {
        root.put(
            "pf_unemployment",
            JSONObject().apply {
                put("pf_corpus_inr", pfCorpusInr)
                put("pf_annual_interest_rate_pct", pfAnnualRatePct)
                put("monthly_pf_addition_inr", 0)
            },
        )
    }
    return root.toString()
}

private fun parseSimulation(inputs: LoanInputs, json: String): LoanSimulation {
    val root = JSONObject(json)
    val baseline = parseScenario(root.getJSONObject("baseline"))
    val prepayEmi = root.optJSONObject("prepay_keep_emi")?.let(::parseScenario)
    val prepayTenure = root.optJSONObject("prepay_keep_tenure")?.let(::parseScenario)
    val pfToLoan = root.optJSONObject("pf_to_loan")?.let(::parseScenario)
    val compare = parseStrategyCompare(root.optJSONArray("strategy_compare"))

    val active = when {
        inputs.pfUnemploymentEnabled && pfToLoan != null -> ActiveScenario.PF_TO_LOAN
        inputs.prepayEnabled && inputs.selectedPolicy == PrepayPolicy.KEEP_TENURE && prepayTenure != null ->
            ActiveScenario.PREPAY_KEEP_TENURE
        inputs.prepayEnabled && prepayEmi != null -> ActiveScenario.PREPAY_KEEP_EMI
        else -> ActiveScenario.BASELINE
    }

    return LoanSimulation(
        inputs = inputs,
        baseline = baseline,
        prepayKeepEmi = prepayEmi,
        prepayKeepTenure = prepayTenure,
        pfToLoan = pfToLoan,
        strategyCompare = compare,
        activeScenario = active,
    )
}

private fun parseScenario(obj: JSONObject): ScenarioTotals {
    val totals = obj.getJSONObject("totals")
    return ScenarioTotals(
        emiInr = obj.getDouble("emi_inr"),
        totalInterestInr = totals.getDouble("total_interest_inr"),
        totalPaidInr = totals.getDouble("total_paid_inr"),
        totalPrepaymentsInr = totals.getDouble("total_prepayments_inr"),
        payoffMonth = totals.getInt("payoff_month"),
    )
}

private fun parseStrategyCompare(arr: JSONArray?): List<StrategyCompareRow> {
    if (arr == null) return emptyList()
    return buildList {
        for (i in 0 until arr.length()) {
            val row = arr.getJSONObject(i)
            add(
                StrategyCompareRow(
                    id = row.getString("id"),
                    policyLabel = row.getString("policy_label"),
                    newEmiInr = row.getDouble("new_emi_inr"),
                    newTenureMonths = row.getInt("new_tenure_months"),
                    totalInterestInr = row.getDouble("total_interest_inr"),
                    grossInterestSavedInr = row.getDouble("gross_interest_saved_inr"),
                ),
            )
        }
    }
}
