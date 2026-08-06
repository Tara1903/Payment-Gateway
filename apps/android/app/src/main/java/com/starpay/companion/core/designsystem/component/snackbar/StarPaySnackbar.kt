package com.starpay.companion.core.designsystem.component.snackbar

import androidx.compose.material3.Snackbar
import androidx.compose.runtime.Composable

@Composable
fun StarPaySnackbar(content: @Composable () -> Unit) {
    Snackbar {
        content()
    }
}
