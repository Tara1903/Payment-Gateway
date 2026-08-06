package com.starpay.companion.core.network

sealed class ResultWrapper<out T> {
    data class Success<out T>(val data: T) : ResultWrapper<T>()
    data class Error(val error: NetworkError) : ResultWrapper<Nothing>()
    object Loading : ResultWrapper<Nothing>()
}
