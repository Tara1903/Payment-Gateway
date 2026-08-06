package com.starpay.companion.core.resources

import androidx.annotation.StringRes
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class StringProvider @Inject constructor(
    private val resourceProvider: ResourceProvider
) {
    fun getString(@StringRes resId: Int): String = resourceProvider.getString(resId)
    fun getString(@StringRes resId: Int, vararg args: Any): String = resourceProvider.getString(resId, *args)
}
