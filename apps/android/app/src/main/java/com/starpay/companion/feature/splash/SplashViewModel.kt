package com.starpay.companion.feature.splash

import com.starpay.companion.core.presentation.BaseViewModel

class SplashViewModel : BaseViewModel<SplashState, SplashEvent, SplashEffect>(initialState = SplashState()) {
    override fun onEvent(event: SplashEvent) {
        when (event) {
            is SplashEvent.OnClick -> {
                // Handle click
            }
        }
    }
}
