package com.starpay.companion.domain.repository

import com.starpay.companion.domain.model.Transaction
import kotlinx.coroutines.flow.Flow

interface TransactionRepository {
    suspend fun saveTransaction(transaction: Transaction)
    suspend fun syncPendingTransactions(): Result<Unit>
    fun getRecentTransactions(): Flow<List<Transaction>>
}
