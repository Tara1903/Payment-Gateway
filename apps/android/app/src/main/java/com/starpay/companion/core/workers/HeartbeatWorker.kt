package com.starpay.companion.core.workers

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.starpay.companion.BuildConfig
import com.starpay.companion.core.logger.StarPayLogger
import com.starpay.companion.core.security.SecureStorageManager
import com.starpay.companion.data.local.dao.TransactionDao
import com.starpay.companion.data.remote.api.StarPayApi
import com.starpay.companion.data.remote.model.HeartbeatDto
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

@HiltWorker
class HeartbeatWorker @AssistedInject constructor(
    @Assisted private val appContext: Context,
    @Assisted params: WorkerParameters,
    private val starPayApi: StarPayApi,
    private val transactionDao: TransactionDao,
    private val secureStorageManager: SecureStorageManager
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        StarPayLogger.d(TAG, "Executing periodic device heartbeat check")
        return try {
            val batteryLevel = getBatteryPercentage(appContext)
            val pendingCount = transactionDao.getPendingTransactions().size
            val deviceId = secureStorageManager.getDeviceId()
            val version = BuildConfig.VERSION_NAME

            val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            val timestampStr = isoFormat.format(Date())

            val payload = HeartbeatDto(
                deviceId = deviceId,
                batteryLevel = batteryLevel,
                appVersion = version,
                queueDepth = pendingCount,
                timestamp = timestampStr
            )

            val response = starPayApi.sendHeartbeat(payload)
            if (response.isSuccessful) {
                StarPayLogger.i(TAG, "Device heartbeat sent successfully")
                Result.success()
            } else {
                StarPayLogger.w(TAG, "Device heartbeat HTTP error: ${response.code()}")
                Result.retry()
            }
        } catch (e: Exception) {
            StarPayLogger.e(TAG, "Failed to send device heartbeat", e)
            Result.retry()
        }
    }

    private fun getBatteryPercentage(context: Context): Int {
        val iFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        val batteryStatus = context.registerReceiver(null, iFilter)
        val level = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        return if (level >= 0 && scale > 0) {
            ((level / scale.toFloat()) * 100).toInt()
        } else {
            100
        }
    }

    companion object {
        const val WORK_NAME = "StarPayHeartbeatWorker"
        private const val TAG = "HeartbeatWorker"
    }
}
