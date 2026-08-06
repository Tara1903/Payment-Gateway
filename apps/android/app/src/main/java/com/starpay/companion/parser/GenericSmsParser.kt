package com.starpay.companion.parser

import com.starpay.companion.domain.model.ParseResult
import com.starpay.companion.domain.model.SyncStatus
import com.starpay.companion.domain.model.Transaction
import com.starpay.companion.core.common.result.AppError
import com.starpay.companion.parser.registry.BankParser
import java.util.UUID
import javax.inject.Inject

class GenericSmsParser @Inject constructor() : BankParser {
    
    companion object {
        private val AMOUNT_REGEX = Regex("(?i)(?:Rs\\.?|INR)\\s*([\\d,]+\\.?\\d*)")
        private val REF_REGEX = Regex("(?i)(?:Ref|UPI|UTR)(?:\\s*(?:no|id|ref|number)?[\\s:-]*)([A-Za-z0-9]{6,20})")
    }

    override fun parse(sender: String, message: String, timestamp: Long): ParseResult {
        val amountMatch = AMOUNT_REGEX.find(message)
        val refMatch = REF_REGEX.find(message)
        
        if (amountMatch != null) {
            val amountStr = amountMatch.groupValues[1].replace(",", "")
            val amount = amountStr.toDoubleOrNull()
            
            if (amount != null) {
                val referenceId = refMatch?.groupValues?.get(1)
                
                val transaction = Transaction(
                    id = UUID.randomUUID().toString(),
                    amount = amount,
                    sender = sender,
                    referenceId = referenceId,
                    timestamp = timestamp,
                    syncStatus = SyncStatus.PENDING,
                    rawMessage = message
                )
                
                return ParseResult.Success(transaction)
            }
        }
        
        return ParseResult.Failure(AppError.ValidationError("Could not extract amount from message"))
    }
}
