package com.starpay.companion.feature.profile

data class ProfileState(val isLoading: Boolean = false)

sealed class ProfileEvent {
    object OnClick : ProfileEvent()
}

sealed class ProfileEffect {
    data class NavigateTo(val route: String) : ProfileEffect()
}
