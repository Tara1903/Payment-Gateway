package com.starpay.companion.data.repository

import com.starpay.companion.data.local.dao.TransactionDao
import com.starpay.companion.data.local.entity.toDomain
import com.starpay.companion.data.local.entity.toEntity
import com.starpay.companion.data.remote.api.StarPayApi
import com.starpay.companion.data.remote.model.toDto
import com.starpay.companion.domain.model.SyncStatus
import com.starpay.companion.domain.model.Transaction
import com.starpay.companion.domain.repository.TransactionRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import javax.inject.Inject

class TransactionRepositoryImpl @Inject constructor(
    private val transactionDao: TransactionDao,
    private val starPayApi: StarPayApi
) : TransactionRepository {

    override suspend fun saveTransaction(transaction: Transaction) {
        withContext(Dispatchers.IO) {
            transactionDao.insert(transaction.toEntity())
        }
    }

    override suspend fun syncPendingTransactions(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val pendingEntities = transactionDao.getPendingTransactions()
            if (pendingEntities.isEmpty()) return@withContext Result.success(Unit)

            val dtos = pendingEntities.map { it.toDomain().toDto() }
            val response = starPayApi.syncTransactions(dtos)

            if (response.isSuccessful) {
                pendingEntities.forEach {
                    transactionDao.updateSyncStatus(it.id, SyncStatus.SYNCED.name)
                }
                Result.success(Unit)
            } else {
                Result.failure(Exception("API Error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun getRecentTransactions(): Flow<List<Transaction>> {
        return transactionDao.getRecentTransactions().map { entities ->
            entities.map { it.toDomain() }
        }
    }
}
