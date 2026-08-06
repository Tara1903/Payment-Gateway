package com.starpay.companion.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.starpay.companion.domain.model.SyncStatus
import com.starpay.companion.domain.model.Transaction

@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey
    val id: String,
    val amount: Double,
    val sender: String,
    val referenceId: String?,
    val timestamp: Long,
    val syncStatus: SyncStatus,
    val rawMessage: String
)

fun TransactionEntity.toDomain(): Transaction {
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

fun Transaction.toEntity(): TransactionEntity {
    return TransactionEntity(
        id = id,
        amount = amount,
        sender = sender,
        referenceId = referenceId,
        timestamp = timestamp,
        syncStatus = syncStatus,
        rawMessage = rawMessage
    )
}
