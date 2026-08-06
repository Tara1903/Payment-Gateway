package com.starpay.companion.initializer

import android.content.Context
import androidx.startup.Initializer

class PreferencesInitializer : Initializer<Unit> {
    override fun create(context: Context) {
        // Initialize DataStore or SharedPreferences if needed early on
    }

    override fun dependencies(): List<Class<out Initializer<*>>> {
        return emptyList()
    }
}
