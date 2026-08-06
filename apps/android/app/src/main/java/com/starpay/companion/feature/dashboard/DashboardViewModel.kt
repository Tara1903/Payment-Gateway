package com.starpay.companion.feature.dashboard

import androidx.lifecycle.viewModelScope
import com.starpay.companion.core.permission.PermissionChecker
import com.starpay.companion.core.presentation.BaseViewModel
import com.starpay.companion.data.remote.api.StarPayApi
import com.starpay.companion.data.remote.model.MerchantDto
import com.starpay.companion.domain.repository.TransactionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val transactionRepository: TransactionRepository,
    private val permissionChecker: PermissionChecker,
    private val starPayApi: StarPayApi
) : BaseViewModel<DashboardState, DashboardEvent, DashboardEffect>(initialState = DashboardState()) {

    init {
        observeTransactions()
        checkPermissions()
        onEvent(DashboardEvent.OnFetchMerchant)
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
            is DashboardEvent.OnFetchMerchant -> fetchMerchant()
            is DashboardEvent.OnToggleMerchantDialog -> {
                setState { copy(showMerchantDialog = !showMerchantDialog) }
            }
            is DashboardEvent.OnUpdateMerchant -> updateMerchant(event.upiId, event.bankAccount, event.bankIfsc)
        }
    }

    private fun fetchMerchant() {
        viewModelScope.launch {
            setState { copy(isMerchantLoading = true) }
            try {
                val response = starPayApi.getMerchantDetails()
                if (response.isSuccessful && response.body()?.success == true) {
                    setState { copy(merchant = response.body()?.data, isMerchantLoading = false) }
                } else {
                    setState { copy(isMerchantLoading = false) }
                }
            } catch (e: Exception) {
                setState { copy(isMerchantLoading = false) }
            }
        }
    }

    private fun updateMerchant(upiId: String, bankAccount: String, bankIfsc: String) {
        viewModelScope.launch {
            setState { copy(isMerchantLoading = true) }
            try {
                val dto = MerchantDto(upi_id = upiId, bank_account = bankAccount, bank_ifsc = bankIfsc)
                val response = starPayApi.updateMerchantDetails(dto)
                if (response.isSuccessful && response.body()?.success == true) {
                    setState { copy(merchant = response.body()?.data, isMerchantLoading = false, showMerchantDialog = false) }
                    setEffect { DashboardEffect.ShowToast("Merchant details updated") }
                } else {
                    setState { copy(isMerchantLoading = false) }
                    setEffect { DashboardEffect.ShowToast("Failed to update merchant") }
                }
            } catch (e: Exception) {
                setState { copy(isMerchantLoading = false) }
                setEffect { DashboardEffect.ShowToast("Network error updating merchant") }
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
