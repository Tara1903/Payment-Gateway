package com.starpay.companion.feature.settings

import com.starpay.companion.core.presentation.BaseViewModel

class SettingsViewModel : BaseViewModel<SettingsState, SettingsEvent, SettingsEffect>(initialState = SettingsState()) {
    override fun onEvent(event: SettingsEvent) {
        when (event) {
            is SettingsEvent.OnClick -> {
                // Handle click
            }
        }
    }
}
