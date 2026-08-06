package com.starpay.companion.core.designsystem.color

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color

@Immutable
data class StarPayColors(
    val primary: Color,
    val onPrimary: Color,
    val background: Color,
    val onBackground: Color,
    val surface: Color,
    val onSurface: Color,
    val error: Color,
    val onError: Color
)

val LightColors = StarPayColors(
    primary = Color(0xFF6200EE),
    onPrimary = Color.White,
    background = Color(0xFFF6F6F6),
    onBackground = Color(0xFF121212),
    surface = Color.White,
    onSurface = Color(0xFF121212),
    error = Color(0xFFB00020),
    onError = Color.White
)

val DarkColors = StarPayColors(
    primary = Color(0xFFBB86FC),
    onPrimary = Color.Black,
    background = Color(0xFF121212),
    onBackground = Color(0xFFF6F6F6),
    surface = Color(0xFF1E1E1E),
    onSurface = Color(0xFFF6F6F6),
    error = Color(0xFFCF6679),
    onError = Color.Black
)
