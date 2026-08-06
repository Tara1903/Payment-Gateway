package com.starpay.companion.initializer

import android.content.Context
import androidx.startup.Initializer

class DatabaseInitializer : Initializer<Unit> {
    override fun create(context: Context) {
        // Initialize Room database or other local storage instances here
    }

    override fun dependencies(): List<Class<out Initializer<*>>> {
        return emptyList()
    }
}
