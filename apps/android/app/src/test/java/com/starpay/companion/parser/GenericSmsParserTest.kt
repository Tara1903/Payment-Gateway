package com.starpay.companion.parser

import com.starpay.companion.domain.model.ParseResult
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class GenericSmsParserTest {

    private val parser = GenericSmsParser()

    @Test
    fun testParseAmountAndUtr() {
        val sms = "Your bank account has been credited with Rs. 5,000.00. UTR No: 123456789012"
        val result = parser.parse("BANK", sms, 123456789L)

        assertTrue(result is ParseResult.Success)
        val transaction = (result as ParseResult.Success).transaction
        
        assertEquals(5000.0, transaction.amount, 0.0)
        assertEquals("123456789012", transaction.referenceId)
    }

    @Test
    fun testParseMissingAmount() {
        val sms = "Your account has been updated."
        val result = parser.parse("BANK", sms, 123456789L)

        assertTrue(result is ParseResult.Failure)
    }
}
