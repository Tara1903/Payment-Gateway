package com.starpay.companion.domain.repository

interface AppPreferenceRepository {
    suspend fun saveString(key: String, value: String)
    suspend fun getString(key: String, defaultValue: String = ""): String
    suspend fun saveBoolean(key: String, value: Boolean)
    suspend fun getBoolean(key: String, defaultValue: Boolean = false): Boolean
    suspend fun clear()
}
