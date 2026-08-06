package com.starpay.companion.core.common.result

sealed interface AppError {
    data class NetworkError(val code: Int, val message: String? = null) : AppError
    data class DatabaseError(val message: String? = null, val exception: Throwable? = null) : AppError
    data class ValidationError(val message: String? = null) : AppError
    data class UnknownError(val message: String? = null, val exception: Throwable? = null) : AppError
}
