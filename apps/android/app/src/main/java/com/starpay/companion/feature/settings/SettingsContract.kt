package com.starpay.companion.feature.settings

data class SettingsState(val isLoading: Boolean = false)

sealed class SettingsEvent {
    object OnClick : SettingsEvent()
}

sealed class SettingsEffect {
    data class NavigateTo(val route: String) : SettingsEffect()
}
