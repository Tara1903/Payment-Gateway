package com.starpay.companion.domain.model

import com.starpay.companion.core.common.result.AppError

sealed interface ParseResult {
    data class Success(val transaction: Transaction) : ParseResult
    data class Failure(val error: AppError) : ParseResult
}
