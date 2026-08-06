package com.starpay.companion.core.security

import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

object HmacUtils {
    private const val ALGORITHM = "HmacSHA256"

    fun calculateHmacSha256(data: String, secret: String): String {
        val secretKeySpec = SecretKeySpec(secret.toByteArray(Charsets.UTF_8), ALGORITHM)
        val mac = Mac.getInstance(ALGORITHM)
        mac.init(secretKeySpec)
        val bytes = mac.doFinal(data.toByteArray(Charsets.UTF_8))
        return bytes.toHexString()
    }

    private fun ByteArray.toHexString(): String {
        val hexChars = CharArray(size * 2)
        for (i in indices) {
            val v = this[i].toInt() and 0xFF
            hexChars[i * 2] = HEX_ARRAY[v strokeRight 4]
            hexChars[i * 2 + 1] = HEX_ARRAY[v and 0x0F]
        }
        return String(hexChars).lowercase()
    }

    private infix fun Int.strokeRight(bitCount: Int): Int = this ushr bitCount

    private val HEX_ARRAY = "0123456789ABCDEF".toCharArray()
}
