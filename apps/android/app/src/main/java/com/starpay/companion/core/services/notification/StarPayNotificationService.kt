package com.starpay.companion.core.services.notification

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.starpay.companion.core.logger.StarPayLogger
import com.starpay.companion.domain.usecase.ProcessNewTransactionUseCase
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class StarPayNotificationService : NotificationListenerService() {

    @Inject
    lateinit var processNewTransactionUseCase: ProcessNewTransactionUseCase

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        sbn ?: return
        val packageName = sbn.packageName ?: "UNKNOWN"

        val extras = sbn.notification?.extras ?: return
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""

        val combinedMessage = if (bigText.isNotBlank()) bigText else text
        if (combinedMessage.isBlank()) return

        val fullPayload = "$title $combinedMessage".trim()
        val postTime = sbn.postTime

        StarPayLogger.d("NotificationService", "Notification received from package: $packageName")

        scope.launch {
            try {
                processNewTransactionUseCase(
                    sender = packageName,
                    message = fullPayload,
                    timestamp = postTime
                )
            } catch (e: Exception) {
                StarPayLogger.e("NotificationService", "Error processing notification from $packageName", e)
            }
        }
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        StarPayLogger.i("NotificationService", "StarPay Notification Listener Connected")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        StarPayLogger.w("NotificationService", "StarPay Notification Listener Disconnected")
    }
}
