package com.starpay.companion.feature.dashboard

import androidx.lifecycle.viewModelScope
import com.starpay.companion.core.permission.PermissionChecker
import com.starpay.companion.core.presentation.BaseViewModel
import com.starpay.companion.domain.repository.TransactionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val transactionRepository: TransactionRepository,
    private val permissionChecker: PermissionChecker
) : BaseViewModel<DashboardState, DashboardEvent, DashboardEffect>(initialState = DashboardState()) {

    init {
        observeTransactions()
        checkPermissions()
    }

    private fun observeTransactions() {
        viewModelScope.launch {
            transactionRepository.getRecentTransactions().collectLatest { transactions ->
                setState { copy(transactions = transactions) }
            }
        }
    }

    fun checkPermissions() {
        setState {
            copy(
                isSmsPermissionGranted = permissionChecker.isSmsPermissionGranted(),
                isNotificationListenerGranted = permissionChecker.isNotificationListenerGranted(),
                isBatteryOptimizationIgnored = permissionChecker.isBatteryOptimizationIgnored()
            )
        }
    }

    override fun onEvent(event: DashboardEvent) {
        when (event) {
            is DashboardEvent.OnSyncNowClicked -> syncPendingTransactions()
            is DashboardEvent.OnRefreshPermissions -> checkPermissions()
            is DashboardEvent.OnOpenNotificationListenerClicked -> {
                setEffect { DashboardEffect.OpenNotificationListenerSettings }
            }
            is DashboardEvent.OnOpenBatterySettingsClicked -> {
                setEffect { DashboardEffect.OpenBatteryOptimizationSettings }
            }
        }
    }

    private fun syncPendingTransactions() {
        viewModelScope.launch {
            setState { copy(isSyncing = true) }
            val result = transactionRepository.syncPendingTransactions()
            setState { copy(isSyncing = false) }
            if (result.isSuccess) {
                setEffect { DashboardEffect.ShowToast("Sync completed successfully") }
            } else {
                val error = result.exceptionOrNull()?.message ?: "Sync failed"
                setEffect { DashboardEffect.ShowToast("Sync failed: $error") }
            }
        }
    }
}
