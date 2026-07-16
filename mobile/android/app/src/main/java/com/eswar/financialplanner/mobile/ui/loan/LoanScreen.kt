package com.eswar.financialplanner.mobile.ui.loan

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.eswar.financialplanner.mobile.R
import com.eswar.financialplanner.mobile.core.ActiveScenario
import com.eswar.financialplanner.mobile.core.LoanSimulation
import com.eswar.financialplanner.mobile.core.ScenarioTotals
import java.text.NumberFormat
import java.util.Locale

private val inrFormat = NumberFormat.getCurrencyInstance(Locale("en", "IN"))

@Composable
fun LoanScreen(viewModel: LoanViewModel) {
    val simulation by viewModel.simulation.collectAsState()
    val inputs = simulation.inputs

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Loan payoff (India)", style = MaterialTheme.typography.headlineSmall)
        Text(
            stringResource(R.string.disclaimer),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        LoanTermsSection(
            principal = inputs.principalInr,
            rate = inputs.annualInterestRate,
            tenure = inputs.tenureMonths,
            onPrincipalChange = viewModel::onPrincipalChange,
            onRateChange = viewModel::onRateChange,
            onTenureChange = viewModel::onTenureChange,
        )

        HorizontalDivider()

        PrepaymentSection(
            enabled = inputs.prepayEnabled,
            month = inputs.prepayMonth,
            amount = inputs.prepayAmountInr,
            onEnabledChange = viewModel::onPrepayEnabledChange,
            onMonthChange = viewModel::onPrepayMonthChange,
            onAmountChange = viewModel::onPrepayAmountChange,
            disabled = inputs.pfUnemploymentEnabled,
        )

        if (inputs.prepayEnabled && !inputs.pfUnemploymentEnabled) {
            PrepayStrategyCompare(
                rows = simulation.strategyCompare,
                selectedPolicy = inputs.selectedPolicy,
                onSelect = viewModel::onPrepayPolicySelect,
            )
        }

        HorizontalDivider()

        PfUnemploymentSection(
            enabled = inputs.pfUnemploymentEnabled,
            corpus = inputs.pfCorpusInr,
            rate = inputs.pfAnnualRatePct,
            onEnabledChange = viewModel::onPfUnemploymentEnabledChange,
            onCorpusChange = viewModel::onPfCorpusChange,
            onRateChange = viewModel::onPfRateChange,
            disabled = inputs.prepayEnabled,
        )

        SummaryCard(simulation)
    }
}

@Composable
private fun LoanTermsSection(
    principal: Double,
    rate: Double,
    tenure: Int,
    onPrincipalChange: (String) -> Unit,
    onRateChange: (String) -> Unit,
    onTenureChange: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Loan terms", style = MaterialTheme.typography.titleMedium)
        OutlinedTextField(
            value = principal.toLong().toString(),
            onValueChange = onPrincipalChange,
            label = { Text("Principal (INR)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = rate.toString(),
            onValueChange = onRateChange,
            label = { Text("Annual rate (%)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = tenure.toString(),
            onValueChange = onTenureChange,
            label = { Text("Tenure (months)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun PrepaymentSection(
    enabled: Boolean,
    month: Int,
    amount: Double,
    onEnabledChange: (Boolean) -> Unit,
    onMonthChange: (String) -> Unit,
    onAmountChange: (String) -> Unit,
    disabled: Boolean,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        RowToggle(
            title = "One-time prepayment",
            subtitle = "Lump-sum cash prepay after EMI in the chosen month",
            checked = enabled,
            onCheckedChange = onEnabledChange,
            enabled = !disabled,
        )
        if (enabled && !disabled) {
            OutlinedTextField(
                value = month.toString(),
                onValueChange = onMonthChange,
                label = { Text("Prepay month") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = amount.toLong().toString(),
                onValueChange = onAmountChange,
                label = { Text("Prepay amount (INR)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
private fun PfUnemploymentSection(
    enabled: Boolean,
    corpus: Double,
    rate: Double,
    onEnabledChange: (Boolean) -> Unit,
    onCorpusChange: (String) -> Unit,
    onRateChange: (String) -> Unit,
    disabled: Boolean,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        RowToggle(
            title = "PF unemployment → loan",
            subtitle = "75% at month 1, 25% + interest at month 12 (SPEC §4.7)",
            checked = enabled,
            onCheckedChange = onEnabledChange,
            enabled = !disabled,
        )
        if (enabled && !disabled) {
            OutlinedTextField(
                value = corpus.toLong().toString(),
                onValueChange = onCorpusChange,
                label = { Text("PF corpus (INR)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = rate.toString(),
                onValueChange = onRateChange,
                label = { Text("PF annual rate (%)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
private fun RowToggle(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    enabled: Boolean = true,
) {
    androidx.compose.foundation.layout.Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
            Text(title, style = MaterialTheme.typography.titleSmall)
            Text(
                subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Switch(checked = checked, onCheckedChange = onCheckedChange, enabled = enabled)
    }
}

@Composable
private fun SummaryCard(simulation: LoanSimulation) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            when {
                simulation.error != null -> {
                    Text("Error: ${simulation.error}", color = MaterialTheme.colorScheme.error)
                }
                else -> {
                    val label = scenarioLabel(simulation.activeScenario)
                    Text(label, style = MaterialTheme.typography.titleMedium)
                    TotalsBlock(simulation.activeTotals)
                    if (simulation.activeScenario != ActiveScenario.BASELINE) {
                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                        Text("vs baseline", style = MaterialTheme.typography.labelMedium)
                        val base = simulation.baseline
                        val active = simulation.activeTotals
                        Text(
                            "Interest saved: ${inrFormat.format(base.totalInterestInr - active.totalInterestInr)}",
                            style = MaterialTheme.typography.bodySmall,
                        )
                        Text(
                            "Payoff ${base.payoffMonth - active.payoffMonth} months sooner",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TotalsBlock(totals: ScenarioTotals) {
    Text("EMI: ${inrFormat.format(totals.emiInr)}", style = MaterialTheme.typography.bodyLarge)
    Text("Total interest: ${inrFormat.format(totals.totalInterestInr)}")
    Text("Total paid: ${inrFormat.format(totals.totalPaidInr)}")
    if (totals.totalPrepaymentsInr > 0) {
        Text("Prepayments: ${inrFormat.format(totals.totalPrepaymentsInr)}")
    }
    Text("Payoff month: ${totals.payoffMonth}")
}

private fun scenarioLabel(scenario: ActiveScenario): String = when (scenario) {
    ActiveScenario.BASELINE -> "Baseline (no prepay)"
    ActiveScenario.PREPAY_KEEP_EMI -> "Prepay — reduce tenure (keep EMI)"
    ActiveScenario.PREPAY_KEEP_TENURE -> "Prepay — reduce EMI (keep tenure)"
    ActiveScenario.PF_TO_LOAN -> "PF unemployment → loan"
}
