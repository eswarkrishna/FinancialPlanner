package com.eswar.financialplanner.mobile.ui.loan

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.eswar.financialplanner.mobile.core.LoanInputs
import com.eswar.financialplanner.mobile.core.LoanSummary
import com.eswar.financialplanner.mobile.core.computeLoanSummary
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

    val summary: StateFlow<LoanSummary> = draft
        .debounce(200)
        .map(::computeLoanSummary)
        .stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5_000),
            LoanSummary(LoanInputs(), null),
        )

    init {
        viewModelScope.launch {
            preferences.inputs.collect { draft.value = it }
        }
    }

    fun onPrincipalChange(value: String) {
        value.toDoubleOrNull()?.let { draft.value = draft.value.copy(principalInr = it) }
    }

    fun onRateChange(value: String) {
        value.toDoubleOrNull()?.let { draft.value = draft.value.copy(annualInterestRate = it) }
    }

    fun onTenureChange(value: String) {
        value.toIntOrNull()?.let { draft.value = draft.value.copy(tenureMonths = it) }
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
