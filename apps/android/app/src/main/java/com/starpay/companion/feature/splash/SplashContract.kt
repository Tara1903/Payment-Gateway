package com.starpay.companion.feature.splash

data class SplashState(val isLoading: Boolean = false)

sealed class SplashEvent {
    object OnClick : SplashEvent()
}

sealed class SplashEffect {
    data class NavigateTo(val route: String) : SplashEffect()
}
