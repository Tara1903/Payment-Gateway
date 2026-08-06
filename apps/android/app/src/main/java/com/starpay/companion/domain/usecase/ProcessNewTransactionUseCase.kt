package com.starpay.companion.domain.usecase

import com.starpay.companion.domain.model.ParseResult
import com.starpay.companion.domain.repository.TransactionRepository
import com.starpay.companion.parser.registry.ParserRegistry
import javax.inject.Inject

class ProcessNewTransactionUseCase @Inject constructor(
    private val parserRegistry: ParserRegistry,
    private val transactionRepository: TransactionRepository
) {
    suspend operator fun invoke(sender: String, message: String, timestamp: Long): Result<Unit> {
        val parser = parserRegistry.getParser(sender)
        
        return when (val result = parser.parse(sender, message, timestamp)) {
            is ParseResult.Success -> {
                try {
                    transactionRepository.saveTransaction(result.transaction)
                    Result.success(Unit)
                } catch (e: Exception) {
                    Result.failure(e)
                }
            }
            is ParseResult.Failure -> {
                Result.failure(Exception("Parsing failed: ${result.error}"))
            }
        }
    }
}
