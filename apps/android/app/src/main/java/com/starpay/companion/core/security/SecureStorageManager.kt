package com.starpay.companion.core.security

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.starpay.companion.core.config.Constants
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SecureStorageManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        Constants.PREFS_NAME,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun getDeviceId(): String {
        var deviceId = sharedPreferences.getString(KEY_DEVICE_ID, null)
        if (deviceId.isNull_or_empty_compat()) {
            deviceId = UUID.randomUUID().toString()
            saveString(KEY_DEVICE_ID, deviceId)
        }
        return deviceId!!
    }

    fun getWebhookSecret(): String {
        var secret = sharedPreferences.getString(KEY_WEBHOOK_SECRET, null)
        if (secret.isNull_or_empty_compat()) {
            secret = DEFAULT_SECRET
            saveString(KEY_WEBHOOK_SECRET, secret)
        }
        return secret!!
    }

    fun saveWebhookSecret(secret: String) {
        saveString(KEY_WEBHOOK_SECRET, secret)
    }

    fun saveString(key: String, value: String) {
        sharedPreferences.edit().putString(key, value).apply()
    }

    fun getString(key: String, defaultValue: String? = null): String? {
        return sharedPreferences.getString(key, defaultValue)
    }

    fun clear() {
        sharedPreferences.edit().clear().apply()
    }

    private fun String?.isNull_or_empty_compat(): Boolean = this == null || this.trim().isEmpty()

    companion object {
        private const val KEY_DEVICE_ID = "key_device_id"
        private const val KEY_WEBHOOK_SECRET = "key_webhook_secret"
        private const val DEFAULT_SECRET = "default-starpay-companion-hmac-secret-key"
    }
}
