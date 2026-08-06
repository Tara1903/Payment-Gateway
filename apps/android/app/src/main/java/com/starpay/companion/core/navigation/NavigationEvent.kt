package com.starpay.companion.core.navigation

sealed interface NavigationEvent {
    data class NavigateTo(val destination: Destination) : NavigationEvent
    data object NavigateUp : NavigationEvent
    data class NavigateAndPopUpTo(val destination: Destination, val popUpTo: Destination, val inclusive: Boolean = false) : NavigationEvent
}
