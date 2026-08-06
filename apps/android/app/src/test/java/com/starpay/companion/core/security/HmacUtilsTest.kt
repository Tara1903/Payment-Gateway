package com.starpay.companion.core.security

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test

class HmacUtilsTest {

    @Test
    fun testHmacSha256Generation() {
        val payload = "{\"amount\":500.0,\"referenceId\":\"123456789012\"}"
        val secret = "my-secret-key"

        val signature = HmacUtils.calculateHmacSha256(payload, secret)

        assertNotNull(signature)
        assertEquals(64, signature.length) // SHA256 hex string is 64 characters

        // Repeat calculation should produce exact same signature
        val signature2 = HmacUtils.calculateHmacSha256(payload, secret)
        assertEquals(signature, signature2)
    }
}
