package com.starpay.companion.feature.authentication

data class AuthenticationState(val isLoading: Boolean = false)

sealed class AuthenticationEvent {
    object OnClick : AuthenticationEvent()
}

sealed class AuthenticationEffect {
    data class NavigateTo(val route: String) : AuthenticationEffect()
}
