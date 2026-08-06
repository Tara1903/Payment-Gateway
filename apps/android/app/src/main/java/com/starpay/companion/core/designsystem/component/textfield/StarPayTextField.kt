package com.starpay.companion.core.designsystem.component.textfield

import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable

@Composable
fun StarPayTextField(value: String, onValueChange: (String) -> Unit) {
    TextField(value = value, onValueChange = onValueChange)
}
