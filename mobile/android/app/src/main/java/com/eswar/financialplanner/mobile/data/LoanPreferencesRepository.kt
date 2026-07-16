package com.eswar.financialplanner.mobile.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.doublePreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.eswar.financialplanner.mobile.core.LoanInputs
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.loanDataStore: DataStore<Preferences> by preferencesDataStore(name = "loan_inputs")

class LoanPreferencesRepository(private val context: Context) {
    private object Keys {
        val principal = doublePreferencesKey("principal_inr")
        val rate = doublePreferencesKey("annual_interest_rate")
        val tenure = intPreferencesKey("tenure_months")
    }

    val inputs: Flow<LoanInputs> = context.loanDataStore.data.map { prefs ->
        LoanInputs(
            principalInr = prefs[Keys.principal] ?: 5_000_000.0,
            annualInterestRate = prefs[Keys.rate] ?: 7.9,
            tenureMonths = prefs[Keys.tenure] ?: 168,
        )
    }

    suspend fun save(inputs: LoanInputs) {
        context.loanDataStore.edit { prefs ->
            prefs[Keys.principal] = inputs.principalInr
            prefs[Keys.rate] = inputs.annualInterestRate
            prefs[Keys.tenure] = inputs.tenureMonths
        }
    }
}
