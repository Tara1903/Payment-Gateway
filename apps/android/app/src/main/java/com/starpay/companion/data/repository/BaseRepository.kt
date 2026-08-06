package com.starpay.companion.data.repository

import com.starpay.companion.core.result.ResultWrapper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

abstract class BaseRepository {

    protected suspend fun <T> safeApiCall(apiCall: suspend () -> T): ResultWrapper<T> {
        return withContext(Dispatchers.IO) {
            try {
                ResultWrapper.Success(apiCall.invoke())
            } catch (e: Exception) {
                ResultWrapper.Error(e, e.message ?: "An unknown network error occurred")
            }
        }
    }

    protected suspend fun <T> safeDatabaseCall(dbCall: suspend () -> T): ResultWrapper<T> {
        return withContext(Dispatchers.IO) {
            try {
                ResultWrapper.Success(dbCall.invoke())
            } catch (e: Exception) {
                ResultWrapper.Error(e, e.message ?: "An unknown database error occurred")
            }
        }
    }
}
