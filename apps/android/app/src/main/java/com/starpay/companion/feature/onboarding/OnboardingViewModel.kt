package com.starpay.companion.feature.onboarding

import com.starpay.companion.core.permission.PermissionChecker
import com.starpay.companion.core.presentation.BaseViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class OnboardingViewModel @Inject constructor(
    private val permissionChecker: PermissionChecker
) : BaseViewModel<OnboardingState, OnboardingEvent, OnboardingEffect>(initialState = OnboardingState()) {

    init {
        checkPermissions()
    }

    fun checkPermissions() {
        setState {
            copy(
                isNotificationGranted = permissionChecker.isNotificationListenerGranted(),
                isBatteryIgnored = permissionChecker.isBatteryOptimizationIgnored()
            )
        }
    }

    override fun onEvent(event: OnboardingEvent) {
        when (event) {
            is OnboardingEvent.OnGrantNotificationClicked -> setEffect { OnboardingEffect.OpenNotificationSettings }
            is OnboardingEvent.OnGrantBatteryClicked -> setEffect { OnboardingEffect.OpenBatterySettings }
            is OnboardingEvent.OnFinishOnboardingClicked -> setEffect { OnboardingEffect.NavigateToDashboard }
            is OnboardingEvent.OnRefreshStatus -> checkPermissions()
        }
    }
}
