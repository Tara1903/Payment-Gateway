package com.starpay.companion.core.services.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.starpay.companion.core.logger.StarPayLogger
import com.starpay.companion.domain.usecase.ProcessNewTransactionUseCase
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class SmsReceiver : BroadcastReceiver() {

    @Inject
    lateinit var processNewTransactionUseCase: ProcessNewTransactionUseCase

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) return

        val pendingResult = goAsync()

        scope.launch {
            try {
                // Group multi-part SMS if received together
                val sender = messages[0].displayOriginatingAddress ?: messages[0].originatingAddress ?: "UNKNOWN"
                val fullBody = messages.joinToString(separator = "") { it.displayMessageBody ?: it.messageBody ?: "" }
                val timestamp = messages[0].timestampMillis

                StarPayLogger.d("SmsReceiver", "Received SMS from $sender")

                if (fullBody.isNotBlank()) {
                    processNewTransactionUseCase(sender, fullBody, timestamp)
                }
            } catch (e: Exception) {
                StarPayLogger.e("SmsReceiver", "Error processing incoming SMS", e)
            } finally {
                pendingResult.finish()
            }
        }
    }
}
