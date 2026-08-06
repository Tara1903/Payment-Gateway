package com.starpay.companion.feature.dashboard

import com.starpay.companion.domain.model.Transaction

data class DashboardState(
    val transactions: List<Transaction> = emptyList(),
    val isSmsPermissionGranted: Boolean = false,
    val isNotificationListenerGranted: Boolean = false,
    val isBatteryOptimizationIgnored: Boolean = false,
    val isSyncing: Boolean = false,
    val errorMessage: String? = null
)

sealed interface DashboardEvent {
    object OnSyncNowClicked : DashboardEvent
    object OnRefreshPermissions : DashboardEvent
    object OnOpenNotificationListenerClicked : DashboardEvent
    object OnOpenBatterySettingsClicked : DashboardEvent
}

sealed interface DashboardEffect {
    data class ShowToast(val message: String) : DashboardEffect
    object OpenNotificationListenerSettings : DashboardEffect
    object OpenBatteryOptimizationSettings : DashboardEffect
}
