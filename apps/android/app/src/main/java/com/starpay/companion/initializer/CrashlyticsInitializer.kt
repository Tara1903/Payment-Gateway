package com.starpay.companion.initializer

import android.content.Context
import androidx.startup.Initializer

class CrashlyticsInitializer : Initializer<Unit> {
    override fun create(context: Context) {
        // Initialize Firebase Crashlytics
    }

    override fun dependencies(): List<Class<out Initializer<*>>> {
        return listOf(TimberInitializer::class.java)
    }
}
