package com.starpay.companion.data.remote.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import com.starpay.companion.domain.model.SyncStatus
import com.starpay.companion.domain.model.Transaction

@Serializable
data class TransactionDto(
    @SerialName("id")
    val id: String,
    @SerialName("amount")
    val amount: Double,
    @SerialName("sender")
    val sender: String,
    @SerialName("referenceId")
    val referenceId: String?,
    @SerialName("timestamp")
    val timestamp: Long,
    @SerialName("syncStatus")
    val syncStatus: SyncStatus,
    @SerialName("rawMessage")
    val rawMessage: String
)

fun TransactionDto.toDomain(): Transaction {
    return Transaction(
        id = id,
        amount = amount,
        sender = sender,
        referenceId = referenceId,
        timestamp = timestamp,
        syncStatus = syncStatus,
        rawMessage = rawMessage
    )
}

fun Transaction.toDto(): TransactionDto {
    return TransactionDto(
        id = id,
        amount = amount,
        sender = sender,
        referenceId = referenceId,
        timestamp = timestamp,
        syncStatus = syncStatus,
        rawMessage = rawMessage
    )
}
