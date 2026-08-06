package com.starpay.companion.core.designsystem.component.navigation

import androidx.compose.material3.NavigationBar
import androidx.compose.runtime.Composable

@Composable
fun StarPayNavigationBar(content: @Composable () -> Unit) {
    NavigationBar {
        content()
    }
}
