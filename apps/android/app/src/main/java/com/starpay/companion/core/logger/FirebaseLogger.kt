package com.starpay.companion.core.logger

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirebaseLogger @Inject constructor() : Logger {
    // In a real app, inject FirebaseAnalytics and log events

    override fun d(message: String, vararg args: Any) {
        // Ignored or log to analytics if appropriate
    }

    override fun i(message: String, vararg args: Any) {
        // Log event to analytics
    }

    override fun w(message: String, vararg args: Any) {
        // Log event to analytics
    }

    override fun w(throwable: Throwable, message: String, vararg args: Any) {
        // Log event to analytics
    }

    override fun e(message: String, vararg args: Any) {
        // Log event to analytics
    }

    override fun e(throwable: Throwable, message: String, vararg args: Any) {
        // Log event to analytics
    }
}
