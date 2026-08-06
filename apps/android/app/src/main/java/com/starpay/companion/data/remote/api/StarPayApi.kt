package com.starpay.companion.data.remote.api

import com.starpay.companion.data.remote.model.HeartbeatDto
import com.starpay.companion.data.remote.model.TransactionDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface StarPayApi {
    @POST("api/webhooks/android")
    suspend fun syncTransactions(@Body transactions: List<TransactionDto>): Response<Unit>

    @POST("api/webhooks/android/heartbeat")
    suspend fun sendHeartbeat(@Body payload: HeartbeatDto): Response<Unit>

    @retrofit2.http.GET("api/webhooks/android/merchant")
    suspend fun getMerchantDetails(): Response<com.starpay.companion.data.remote.model.MerchantResponse>

    @retrofit2.http.PATCH("api/webhooks/android/merchant")
    suspend fun updateMerchantDetails(@Body payload: com.starpay.companion.data.remote.model.MerchantDto): Response<com.starpay.companion.data.remote.model.MerchantResponse>
}
