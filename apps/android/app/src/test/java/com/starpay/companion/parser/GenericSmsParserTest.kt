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
    fun testParseSbiCreditSms() {
        val sms = "Dear SBI User, your A/c ending 2441 is credited by Rs.500.07 on 03Oct26 by transfer from Hari Singh UPI/DR/527712345678/UPI Ref no 527712345678 - SBI"
        val result = parser.parse("VK-SBIUPI", sms, 123456789L)

        assertTrue(result is ParseResult.Success)
        val transaction = (result as ParseResult.Success).transaction
        
        assertEquals(500.07, transaction.amount, 0.001)
        assertEquals("527712345678", transaction.referenceId)
    }

    @Test
    fun testParseSbiSlashCrSms() {
        val sms = "Dear SBI Customer, A/c 2441 credited by Rs.10.50 on 03-10-26 by UPI/CR/527799881122/Transfer"
        val result = parser.parse("SBIUPI", sms, 123456789L)

        assertTrue(result is ParseResult.Success)
        val transaction = (result as ParseResult.Success).transaction
        
        assertEquals(10.50, transaction.amount, 0.001)
        assertEquals("527799881122", transaction.referenceId)
    }

    @Test
    fun testParseMissingAmount() {
        val sms = "Your account has been updated."
        val result = parser.parse("BANK", sms, 123456789L)

        assertTrue(result is ParseResult.Failure)
    }
}
