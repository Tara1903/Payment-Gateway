package com.starpay.companion.core.navigation

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.starpay.companion.feature.authentication.AuthenticationScreen
import com.starpay.companion.feature.dashboard.DashboardScreen
import com.starpay.companion.feature.onboarding.OnboardingScreen
import com.starpay.companion.feature.profile.ProfileScreen
import com.starpay.companion.feature.settings.SettingsScreen
import com.starpay.companion.feature.splash.SplashScreen

@Composable
fun StarPayNavGraph(
    navController: NavHostController,
) {
    NavHost(
        navController = navController,
        startDestination = Destination.Dashboard
    ) {
        composable<Destination.Splash> {
            SplashScreen(viewModel = hiltViewModel())
        }
        composable<Destination.Onboarding> {
            OnboardingScreen(
                viewModel = hiltViewModel(),
                onNavigateToDashboard = {
                    navController.navigate(Destination.Dashboard) {
                        popUpTo(Destination.Onboarding) { inclusive = true }
                    }
                }
            )
        }
        composable<Destination.Authentication> {
            AuthenticationScreen(viewModel = hiltViewModel())
        }
        composable<Destination.Dashboard> {
            DashboardScreen(viewModel = hiltViewModel())
        }
        composable<Destination.Profile> {
            ProfileScreen(viewModel = hiltViewModel())
        }
        composable<Destination.Settings> {
            SettingsScreen(viewModel = hiltViewModel())
        }
    }
}
