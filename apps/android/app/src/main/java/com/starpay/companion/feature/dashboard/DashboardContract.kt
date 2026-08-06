package com.starpay.companion.feature.dashboard

import com.starpay.companion.domain.model.Transaction
import com.starpay.companion.data.remote.model.MerchantDto

data class DashboardState(
    val transactions: List<Transaction> = emptyList(),
    val isNotificationListenerGranted: Boolean = false,
    val isBatteryOptimizationIgnored: Boolean = false,
    val isSyncing: Boolean = false,
    val errorMessage: String? = null,
    val merchant: MerchantDto? = null,
    val isMerchantLoading: Boolean = false,
    val showMerchantDialog: Boolean = false
)

sealed interface DashboardEvent {
    object OnSyncNowClicked : DashboardEvent
    object OnRefreshPermissions : DashboardEvent
    object OnOpenNotificationListenerClicked : DashboardEvent
    object OnOpenBatterySettingsClicked : DashboardEvent
    object OnFetchMerchant : DashboardEvent
    object OnToggleMerchantDialog : DashboardEvent
    data class OnUpdateMerchant(val upiId: String, val bankAccount: String, val bankIfsc: String) : DashboardEvent
}

sealed interface DashboardEffect {
    data class ShowToast(val message: String) : DashboardEffect
    object OpenNotificationListenerSettings : DashboardEffect
    object OpenBatteryOptimizationSettings : DashboardEffect
}
