package com.starpay.companion.core.result

sealed class ResultWrapper<out T> {
    data class Success<out T>(val data: T) : ResultWrapper<T>()
    data class Error(val exception: Exception, val message: String? = null) : ResultWrapper<Nothing>()
    object Loading : ResultWrapper<Nothing>()
}
