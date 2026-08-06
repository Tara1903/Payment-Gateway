package com.starpay.companion.core.presentation

interface ScreenContract<State, Event, Effect> {
    val state: State
    fun onEvent(event: Event)
    val effect: kotlinx.coroutines.flow.SharedFlow<Effect>
}
