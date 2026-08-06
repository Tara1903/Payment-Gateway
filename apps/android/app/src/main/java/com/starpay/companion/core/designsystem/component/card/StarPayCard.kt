package com.starpay.companion.core.designsystem.component.card

import androidx.compose.material3.Card
import androidx.compose.runtime.Composable

@Composable
fun StarPayCard(content: @Composable () -> Unit) {
    Card {
        content()
    }
}
