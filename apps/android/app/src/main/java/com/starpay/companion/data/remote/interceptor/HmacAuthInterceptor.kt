package com.starpay.companion.data.remote.interceptor

import com.starpay.companion.core.security.HmacUtils
import com.starpay.companion.core.security.SecureStorageManager
import okhttp3.Interceptor
import okhttp3.Response
import okio.Buffer
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HmacAuthInterceptor @Inject constructor(
    private val secureStorageManager: SecureStorageManager
) : Interceptor {

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val timestamp = System.currentTimeMillis().toString()
        val deviceId = secureStorageManager.getDeviceId()
        val secret = secureStorageManager.getWebhookSecret()

        val bodyBuffer = Buffer()
        originalRequest.body?.writeTo(bodyBuffer)
        val requestBodyString = bodyBuffer.readUtf8()

        val signatureData = if (requestBodyString.isNotEmpty()) {
            "$timestamp.$requestBodyString"
        } else {
            "$timestamp."
        }

        val signature = HmacUtils.calculateHmacSha256(signatureData, secret)

        val authenticatedRequest = originalRequest.newBuilder()
            .header("X-Signature", signature)
            .header("X-Device-Id", deviceId)
            .header("X-Timestamp", timestamp)
            .build()

        return chain.proceed(authenticatedRequest)
    }
}
