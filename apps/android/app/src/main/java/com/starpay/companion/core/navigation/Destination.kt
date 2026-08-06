package com.starpay.companion.core.navigation

import kotlinx.serialization.Serializable

sealed interface Destination {
    @Serializable data object Splash : Destination
    @Serializable data object Onboarding : Destination
    @Serializable data object Authentication : Destination
    @Serializable data object Dashboard : Destination
    @Serializable data object Profile : Destination
    @Serializable data object Settings : Destination
}
