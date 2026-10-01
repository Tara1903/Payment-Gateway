package com.starpay.companion.data.remote.model

import kotlinx.serialization.Serializable

@Serializable
data class ConnectedAppDto(
    val name: String,
    val webhookUrl: String? = null,
    val totalOrders: Int = 0,
    val lastActive: String? = null,
    val status: String = "Active"
)

@Serializable
data class MerchantDto(
    val name: String? = null,
    val upi_id: String? = null,
    val bank_account: String? = null,
    val bank_ifsc: String? = null,
    val connected_apps: List<ConnectedAppDto> = emptyList()
)

@Serializable
data class MerchantResponse(
    val success: Boolean,
    val data: MerchantDto? = null
)
