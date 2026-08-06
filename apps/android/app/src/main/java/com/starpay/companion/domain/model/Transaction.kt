package com.starpay.companion.domain.model

import java.util.UUID

data class Transaction(
    val id: String = UUID.randomUUID().toString(),
    val amount: Double,
    val sender: String,
    val referenceId: String?,
    val timestamp: Long,
    val syncStatus: SyncStatus,
    val rawMessage: String
)
