package com.starpay.companion.feature.profile

import com.starpay.companion.core.presentation.BaseViewModel

class ProfileViewModel : BaseViewModel<ProfileState, ProfileEvent, ProfileEffect>(initialState = ProfileState()) {
    override fun onEvent(event: ProfileEvent) {
        when (event) {
            is ProfileEvent.OnClick -> {
                // Handle click
            }
        }
    }
}
