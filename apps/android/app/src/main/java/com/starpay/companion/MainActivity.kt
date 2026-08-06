package com.starpay.companion

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.navigation.compose.rememberNavController
import dagger.hilt.android.AndroidEntryPoint
import com.starpay.companion.core.designsystem.theme.StarPayTheme
import com.starpay.companion.core.navigation.StarPayNavGraph

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            StarPayTheme {
                val navController = rememberNavController()
                StarPayNavGraph(navController = navController)
            }
        }
    }
}
