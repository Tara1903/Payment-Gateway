package com.starpay.companion.data.remote.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class HeartbeatDto(
    @SerialName("deviceId")
    val deviceId: String,
    @SerialName("batteryLevel")
    val batteryLevel: Int,
    @SerialName("appVersion")
    val appVersion: String,
    @SerialName("queueDepth")
    val queueDepth: Int,
    @SerialName("timestamp")
    val timestamp: String
)
