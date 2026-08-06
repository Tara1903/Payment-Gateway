package com.starpay.companion.feature.authentication

import com.starpay.companion.core.presentation.BaseViewModel

class AuthenticationViewModel : BaseViewModel<AuthenticationState, AuthenticationEvent, AuthenticationEffect>(initialState = AuthenticationState()) {
    override fun onEvent(event: AuthenticationEvent) {
        when (event) {
            is AuthenticationEvent.OnClick -> {
                // Handle click
            }
        }
    }
}
