package com.starpay.companion.core.extensions

fun String.Companion.empty() = ""

fun String?.orEmpty(): String = this ?: String.empty()

fun String.isValidEmail(): Boolean {
    return android.util.Patterns.EMAIL_ADDRESS.matcher(this).matches()
}

fun String.isValidPhone(): Boolean {
    return android.util.Patterns.PHONE.matcher(this).matches()
}
