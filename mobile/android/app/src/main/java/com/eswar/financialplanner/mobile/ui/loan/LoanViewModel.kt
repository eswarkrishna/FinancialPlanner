package com.eswar.financialplanner.mobile.ui.loan

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.eswar.financialplanner.mobile.core.LoanInputs
import com.eswar.financialplanner.mobile.core.LoanSimulation
import com.eswar.financialplanner.mobile.core.PrepayPolicy
import com.eswar.financialplanner.mobile.core.computeLoanSimulation
import com.eswar.financialplanner.mobile.data.LoanPreferencesRepository
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@OptIn(FlowPreview::class)
class LoanViewModel(
    private val preferences: LoanPreferencesRepository,
) : ViewModel() {
    private val draft = MutableStateFlow(LoanInputs())

    val simulation: StateFlow<LoanSimulation> = draft
        .debounce(200)
        .map(::computeLoanSimulation)
        .stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5_000),
            computeLoanSimulation(LoanInputs()),
        )

    init {
        viewModelScope.launch {
            preferences.inputs.collect { draft.value = it }
        }
    }

    private fun update(block: (LoanInputs) -> LoanInputs) {
        draft.value = block(draft.value)
    }

    fun onPrincipalChange(value: String) {
        value.toDoubleOrNull()?.let { v -> update { it.copy(principalInr = v) } }
    }

    fun onRateChange(value: String) {
        value.toDoubleOrNull()?.let { v -> update { it.copy(annualInterestRate = v) } }
    }

    fun onTenureChange(value: String) {
        value.toIntOrNull()?.let { v -> update { it.copy(tenureMonths = v) } }
    }

    fun onPrepayEnabledChange(enabled: Boolean) {
        update { it.copy(prepayEnabled = enabled) }
    }

    fun onPrepayMonthChange(value: String) {
        value.toIntOrNull()?.let { v -> update { it.copy(prepayMonth = v) } }
    }

    fun onPrepayAmountChange(value: String) {
        value.toDoubleOrNull()?.let { v -> update { it.copy(prepayAmountInr = v) } }
    }

    fun onPrepayPolicySelect(policy: PrepayPolicy) {
        update { it.copy(selectedPolicy = policy, pfUnemploymentEnabled = false) }
    }

    fun onPfUnemploymentEnabledChange(enabled: Boolean) {
        update {
            it.copy(
                pfUnemploymentEnabled = enabled,
                prepayEnabled = if (enabled) false else it.prepayEnabled,
            )
        }
    }

    fun onPfCorpusChange(value: String) {
        value.toDoubleOrNull()?.let { v -> update { it.copy(pfCorpusInr = v) } }
    }

    fun onPfRateChange(value: String) {
        value.toDoubleOrNull()?.let { v -> update { it.copy(pfAnnualRatePct = v) } }
    }

    fun persist() {
        viewModelScope.launch {
            preferences.save(draft.value)
        }
    }
}

class LoanViewModelFactory(
    private val preferences: LoanPreferencesRepository,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(LoanViewModel::class.java)) {
            return LoanViewModel(preferences) as T
        }
        throw IllegalArgumentException("Unknown ViewModel: $modelClass")
    }
}
