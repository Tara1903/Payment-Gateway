package com.starpay.companion.core.network

data class NetworkError(
    val code: Int = -1,
    val message: String? = null,
    val throwable: Throwable? = null
)
