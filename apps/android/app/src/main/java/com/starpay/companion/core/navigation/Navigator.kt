package com.starpay.companion.core.navigation

import kotlinx.coroutines.flow.SharedFlow

interface Navigator {
    val navigationEvents: SharedFlow<NavigationEvent>
    fun navigateTo(destination: Destination)
    fun navigateUp()
    fun navigateAndPopUpTo(destination: Destination, popUpTo: Destination, inclusive: Boolean = false)
}
