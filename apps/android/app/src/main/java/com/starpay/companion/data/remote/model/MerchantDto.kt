package com.starpay.companion.data.remote.model

import kotlinx.serialization.Serializable

@Serializable
data class MerchantDto(
    val name: String? = null,
    val upi_id: String? = null,
    val bank_account: String? = null,
    val bank_ifsc: String? = null
)

@Serializable
data class MerchantResponse(
    val success: Boolean,
    val data: MerchantDto? = null
)
