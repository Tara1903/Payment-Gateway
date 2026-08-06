package com.starpay.companion.core.logger

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CrashlyticsLogger @Inject constructor() : Logger {
    // In a real app, inject FirebaseCrashlytics

    override fun d(message: String, vararg args: Any) {
        // FirebaseCrashlytics.getInstance().log(String.format(message, *args))
    }

    override fun i(message: String, vararg args: Any) {
        // FirebaseCrashlytics.getInstance().log(String.format(message, *args))
    }

    override fun w(message: String, vararg args: Any) {
        // FirebaseCrashlytics.getInstance().log(String.format(message, *args))
    }

    override fun w(throwable: Throwable, message: String, vararg args: Any) {
        // FirebaseCrashlytics.getInstance().recordException(throwable)
    }

    override fun e(message: String, vararg args: Any) {
        // FirebaseCrashlytics.getInstance().log(String.format(message, *args))
    }

    override fun e(throwable: Throwable, message: String, vararg args: Any) {
        // FirebaseCrashlytics.getInstance().recordException(throwable)
    }
}
