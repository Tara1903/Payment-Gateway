package com.starpay.companion.core.extensions

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.collectLatest

@Composable
fun <T> CollectEffect(effectFlow: Flow<T>, onEffect: (T) -> Unit) {
    LaunchedEffect(effectFlow) {
        effectFlow.collectLatest { effect ->
            onEffect(effect)
        }
    }
}
