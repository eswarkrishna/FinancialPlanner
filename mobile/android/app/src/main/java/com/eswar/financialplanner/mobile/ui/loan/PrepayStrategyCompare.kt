package com.eswar.financialplanner.mobile.ui.loan

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.eswar.financialplanner.mobile.core.PrepayPolicy
import com.eswar.financialplanner.mobile.core.StrategyCompareRow
import java.text.NumberFormat
import java.util.Locale

private val inrFormat = NumberFormat.getCurrencyInstance(Locale("en", "IN"))

@Composable
fun PrepayStrategyCompare(
    rows: List<StrategyCompareRow>,
    selectedPolicy: PrepayPolicy,
    onSelect: (PrepayPolicy) -> Unit,
    modifier: Modifier = Modifier,
) {
    if (rows.isEmpty()) return

    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Reduce EMI vs Reduce Tenure", style = MaterialTheme.typography.titleMedium)
        Text(
            "Side-by-side prepayment policies for your lump-sum prepay (SPEC §4.4).",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            rows.forEach { row ->
                val policy = if (row.id == "PREPAY_EMI") PrepayPolicy.KEEP_EMI else PrepayPolicy.KEEP_TENURE
                val selected = selectedPolicy == policy
                Card(
                    onClick = { onSelect(policy) },
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(
                        containerColor = if (selected) {
                            MaterialTheme.colorScheme.primaryContainer
                        } else {
                            MaterialTheme.colorScheme.surface
                        },
                    ),
                    border = if (selected) {
                        BorderStroke(2.dp, MaterialTheme.colorScheme.primary)
                    } else {
                        BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                    },
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Text(row.policyLabel, style = MaterialTheme.typography.labelLarge)
                        Text("EMI: ${inrFormat.format(row.newEmiInr)}", style = MaterialTheme.typography.bodySmall)
                        Text("Tenure: ${row.newTenureMonths} mo", style = MaterialTheme.typography.bodySmall)
                        Text(
                            "Interest saved: ${inrFormat.format(row.grossInterestSavedInr)}",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
            }
        }
    }
}
