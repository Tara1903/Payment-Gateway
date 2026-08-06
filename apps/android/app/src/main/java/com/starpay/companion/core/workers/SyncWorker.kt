package com.starpay.companion.core.workers

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.starpay.companion.core.logger.StarPayLogger
import com.starpay.companion.domain.repository.TransactionRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted params: WorkerParameters,
    private val transactionRepository: TransactionRepository
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        StarPayLogger.d("SyncWorker", "Executing scheduled background sync for pending transactions")
        return try {
            val syncResult = transactionRepository.syncPendingTransactions()
            if (syncResult.isSuccess) {
                StarPayLogger.i("SyncWorker", "Sync worker completed successfully")
                Result.success()
            } else {
                StarPayLogger.w("SyncWorker", "Sync worker failed, will retry: ${syncResult.exceptionOrNull()?.message}")
                Result.retry()
            }
        } catch (e: Exception) {
            StarPayLogger.e("SyncWorker", "Unhandled exception during sync worker execution", e)
            Result.retry()
        }
    }

    companion object {
        const val WORK_NAME = "StarPaySyncWorker"
    }
}
