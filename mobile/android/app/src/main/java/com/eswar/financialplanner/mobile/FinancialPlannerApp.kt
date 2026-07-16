package com.eswar.financialplanner.mobile

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.eswar.financialplanner.mobile.data.LoanPreferencesRepository
import com.eswar.financialplanner.mobile.ui.loan.LoanScreen
import com.eswar.financialplanner.mobile.ui.loan.LoanViewModel
import com.eswar.financialplanner.mobile.ui.loan.LoanViewModelFactory

@Composable
fun FinancialPlannerApp() {
    val context = LocalContext.current
    val repo = LoanPreferencesRepository(context.applicationContext)
    val viewModel: LoanViewModel = viewModel(factory = LoanViewModelFactory(repo))

    DisposableEffect(Unit) {
        onDispose { viewModel.persist() }
    }

    MaterialTheme {
        Surface {
            LoanScreen(viewModel = viewModel)
        }
    }
}
