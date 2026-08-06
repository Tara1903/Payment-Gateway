package com.starpay.companion.initializer

import android.content.Context
import androidx.startup.Initializer

class AnalyticsInitializer : Initializer<Unit> {
    override fun create(context: Context) {
        // Initialize Firebase Analytics or other analytics services
    }

    override fun dependencies(): List<Class<out Initializer<*>>> {
        return emptyList()
    }
}
