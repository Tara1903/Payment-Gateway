package com.starpay.companion.core.designsystem.component.dialog

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun StarPayDialog(onDismissRequest: () -> Unit, title: String, text: String) {
    AlertDialog(
        onDismissRequest = onDismissRequest,
        confirmButton = {},
        title = { Text(text = title) },
        text = { Text(text = text) }
    )
}
