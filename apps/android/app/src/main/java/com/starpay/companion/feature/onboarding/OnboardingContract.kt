package com.starpay.companion.feature.onboarding

data class OnboardingState(
    val isNotificationGranted: Boolean = false,
    val isBatteryIgnored: Boolean = false
)

sealed interface OnboardingEvent {
    object OnGrantNotificationClicked : OnboardingEvent
    object OnGrantBatteryClicked : OnboardingEvent
    object OnFinishOnboardingClicked : OnboardingEvent
    object OnRefreshStatus : OnboardingEvent
}

sealed interface OnboardingEffect {
    object OpenNotificationSettings : OnboardingEffect
    object OpenBatterySettings : OnboardingEffect
    object NavigateToDashboard : OnboardingEffect
}
