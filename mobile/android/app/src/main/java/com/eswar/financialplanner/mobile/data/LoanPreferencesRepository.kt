package com.eswar.financialplanner.mobile.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.doublePreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.eswar.financialplanner.mobile.core.LoanInputs
import com.eswar.financialplanner.mobile.core.PrepayPolicy
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.loanDataStore: DataStore<Preferences> by preferencesDataStore(name = "loan_inputs")

class LoanPreferencesRepository(private val context: Context) {
    private object Keys {
        val principal = doublePreferencesKey("principal_inr")
        val rate = doublePreferencesKey("annual_interest_rate")
        val tenure = intPreferencesKey("tenure_months")
        val prepayEnabled = booleanPreferencesKey("prepay_enabled")
        val prepayMonth = intPreferencesKey("prepay_month")
        val prepayAmount = doublePreferencesKey("prepay_amount_inr")
        val prepayPolicy = stringPreferencesKey("prepay_policy")
        val pfEnabled = booleanPreferencesKey("pf_unemployment_enabled")
        val pfCorpus = doublePreferencesKey("pf_corpus_inr")
        val pfRate = doublePreferencesKey("pf_annual_rate_pct")
    }

    val inputs: Flow<LoanInputs> = context.loanDataStore.data.map { prefs ->
        LoanInputs(
            principalInr = prefs[Keys.principal] ?: 5_000_000.0,
            annualInterestRate = prefs[Keys.rate] ?: 7.9,
            tenureMonths = prefs[Keys.tenure] ?: 168,
            prepayEnabled = prefs[Keys.prepayEnabled] ?: false,
            prepayMonth = prefs[Keys.prepayMonth] ?: 1,
            prepayAmountInr = prefs[Keys.prepayAmount] ?: 2_500_000.0,
            selectedPolicy = when (prefs[Keys.prepayPolicy]) {
                "KEEP_TENURE" -> PrepayPolicy.KEEP_TENURE
                else -> PrepayPolicy.KEEP_EMI
            },
            pfUnemploymentEnabled = prefs[Keys.pfEnabled] ?: false,
            pfCorpusInr = prefs[Keys.pfCorpus] ?: 2_500_000.0,
            pfAnnualRatePct = prefs[Keys.pfRate] ?: 8.25,
        )
    }

    suspend fun save(inputs: LoanInputs) {
        context.loanDataStore.edit { prefs ->
            prefs[Keys.principal] = inputs.principalInr
            prefs[Keys.rate] = inputs.annualInterestRate
            prefs[Keys.tenure] = inputs.tenureMonths
            prefs[Keys.prepayEnabled] = inputs.prepayEnabled
            prefs[Keys.prepayMonth] = inputs.prepayMonth
            prefs[Keys.prepayAmount] = inputs.prepayAmountInr
            prefs[Keys.prepayPolicy] = inputs.selectedPolicy.name
            prefs[Keys.pfEnabled] = inputs.pfUnemploymentEnabled
            prefs[Keys.pfCorpus] = inputs.pfCorpusInr
            prefs[Keys.pfRate] = inputs.pfAnnualRatePct
        }
    }
}
