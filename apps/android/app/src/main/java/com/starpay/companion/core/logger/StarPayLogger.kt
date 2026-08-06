package com.starpay.companion.core.logger

import timber.log.Timber

object StarPayLogger {
    fun init() {
        Timber.plant(Timber.DebugTree())
    }

    fun d(message: String, vararg args: Any?) = Timber.d(message, *args)
    fun d(tag: String, message: String) = Timber.tag(tag).d(message)

    fun i(message: String, vararg args: Any?) = Timber.i(message, *args)
    fun i(tag: String, message: String) = Timber.tag(tag).i(message)

    fun w(message: String, vararg args: Any?) = Timber.w(message, *args)
    fun w(tag: String, message: String) = Timber.tag(tag).w(message)

    fun e(message: String, t: Throwable? = null) {
        if (t != null) {
            Timber.e(t, message)
        } else {
            Timber.e(message)
        }
    }

    fun e(t: Throwable?, message: String, vararg args: Any?) = Timber.e(t, message, *args)
    fun e(tag: String, message: String, t: Throwable? = null) {
        if (t != null) {
            Timber.tag(tag).e(t, message)
        } else {
            Timber.tag(tag).e(message)
        }
    }
}
