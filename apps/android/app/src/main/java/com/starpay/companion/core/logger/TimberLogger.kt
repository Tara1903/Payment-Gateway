package com.starpay.companion.core.logger

import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TimberLogger @Inject constructor() : Logger {
    override fun d(message: String, vararg args: Any) {
        Timber.d(message, *args)
    }

    override fun i(message: String, vararg args: Any) {
        Timber.i(message, *args)
    }

    override fun w(message: String, vararg args: Any) {
        Timber.w(message, *args)
    }

    override fun w(throwable: Throwable, message: String, vararg args: Any) {
        Timber.w(throwable, message, *args)
    }

    override fun e(message: String, vararg args: Any) {
        Timber.e(message, *args)
    }

    override fun e(throwable: Throwable, message: String, vararg args: Any) {
        Timber.e(throwable, message, *args)
    }
}
