package com.starpay.companion.core.designsystem.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import com.starpay.companion.core.designsystem.color.DarkColors
import com.starpay.companion.core.designsystem.color.LightColors
import com.starpay.companion.core.designsystem.color.StarPayColors
import com.starpay.companion.core.designsystem.shape.StarPayShapes
import com.starpay.companion.core.designsystem.spacing.StarPaySpacing
import com.starpay.companion.core.designsystem.typography.StarPayTypography

val LocalStarPayColors = staticCompositionLocalOf { LightColors }
val LocalStarPayTypography = staticCompositionLocalOf { StarPayTypography() }
val LocalStarPaySpacing = staticCompositionLocalOf { StarPaySpacing() }
val LocalStarPayShapes = staticCompositionLocalOf { StarPayShapes() }

object StarPayTheme {
    val colors: StarPayColors
        @Composable
        get() = LocalStarPayColors.current
    
    val typography: StarPayTypography
        @Composable
        get() = LocalStarPayTypography.current
        
    val spacing: StarPaySpacing
        @Composable
        get() = LocalStarPaySpacing.current

    val shapes: StarPayShapes
        @Composable
        get() = LocalStarPayShapes.current
}

@Composable
fun StarPayTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColors else LightColors
    
    CompositionLocalProvider(
        LocalStarPayColors provides colors,
        LocalStarPayTypography provides StarPayTypography(),
        LocalStarPaySpacing provides StarPaySpacing(),
        LocalStarPayShapes provides StarPayShapes()
    ) {
        MaterialTheme(
            colorScheme = if (darkTheme) darkColorScheme(
                primary = colors.primary,
                background = colors.background,
                surface = colors.surface,
                error = colors.error
            ) else lightColorScheme(
                primary = colors.primary,
                background = colors.background,
                surface = colors.surface,
                error = colors.error
            ),
            content = content
        )
    }
}
