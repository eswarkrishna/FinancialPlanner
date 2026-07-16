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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.eswar.financialplanner.mobile.R
import com.eswar.financialplanner.mobile.core.LoanSummary
import java.text.NumberFormat
import java.util.Locale

private val inrFormat = NumberFormat.getCurrencyInstance(Locale("en", "IN"))

@Composable
fun LoanScreen(viewModel: LoanViewModel) {
    val summary by viewModel.summary.collectAsState()
    val inputs = summary.inputs

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

        OutlinedTextField(
            value = inputs.principalInr.toLong().toString(),
            onValueChange = viewModel::onPrincipalChange,
            label = { Text("Principal (INR)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = inputs.annualInterestRate.toString(),
            onValueChange = viewModel::onRateChange,
            label = { Text("Annual rate (%)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = inputs.tenureMonths.toString(),
            onValueChange = viewModel::onTenureChange,
            label = { Text("Tenure (months)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
        )

        SummaryCard(summary)
    }
}

@Composable
private fun SummaryCard(summary: LoanSummary) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            when {
                summary.error != null -> Text("Error: ${summary.error}", color = MaterialTheme.colorScheme.error)
                summary.totals == null -> Text("Enter valid loan details")
                else -> {
                    val t = summary.totals!!
                    Text("EMI: ${inrFormat.format(t.emiInr)}", style = MaterialTheme.typography.titleMedium)
                    Text("Total interest: ${inrFormat.format(t.totalInterestInr)}")
                    Text("Total paid: ${inrFormat.format(t.totalPaidInr)}")
                    Text("Payoff month: ${t.payoffMonth}")
                }
            }
        }
    }
}
