package com.starpay.companion.initializer

import android.content.Context
import androidx.startup.Initializer
import com.starpay.companion.core.logger.StarPayLogger

class LoggerInitializer : Initializer<Unit> {
    override fun create(context: Context) {
        StarPayLogger.init()
    }

    override fun dependencies(): List<Class<out Initializer<*>>> {
        return emptyList()
    }
}
