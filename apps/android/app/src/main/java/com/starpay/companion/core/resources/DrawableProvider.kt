package com.starpay.companion.core.resources

import android.graphics.drawable.Drawable
import androidx.annotation.DrawableRes
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DrawableProvider @Inject constructor(
    private val resourceProvider: ResourceProvider
) {
    fun getDrawable(@DrawableRes resId: Int): Drawable? = resourceProvider.getDrawable(resId)
}
