package com.starpay.companion.data.remote.api

import com.starpay.companion.data.remote.model.HeartbeatDto
import com.starpay.companion.data.remote.model.TransactionDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface StarPayApi {
    @POST("api/v1/transactions/sync")
    suspend fun syncTransactions(@Body transactions: List<TransactionDto>): Response<Unit>

    @POST("api/v1/webhooks/android/heartbeat")
    suspend fun sendHeartbeat(@Body payload: HeartbeatDto): Response<Unit>
}
