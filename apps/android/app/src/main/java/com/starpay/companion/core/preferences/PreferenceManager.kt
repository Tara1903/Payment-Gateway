package com.starpay.companion.core.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.starpay.companion.core.constants.PreferenceKeys
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = PreferenceKeys.PREF_DATASTORE_NAME)

@Singleton
class PreferenceManager @Inject constructor(private val context: Context) {

    private val dataStore = context.dataStore

    private object Keys {
        val isFirstLaunch = booleanPreferencesKey(PreferenceKeys.KEY_IS_FIRST_LAUNCH)
        val authToken = stringPreferencesKey(PreferenceKeys.KEY_AUTH_TOKEN)
        val userId = stringPreferencesKey(PreferenceKeys.KEY_USER_ID)
        val themeMode = stringPreferencesKey(PreferenceKeys.KEY_THEME_MODE)
    }

    val isFirstLaunchFlow: Flow<Boolean> = dataStore.data.map { preferences ->
        preferences[Keys.isFirstLaunch] ?: true
    }

    suspend fun setFirstLaunch(isFirstLaunch: Boolean) {
        dataStore.edit { preferences ->
            preferences[Keys.isFirstLaunch] = isFirstLaunch
        }
    }

    val authTokenFlow: Flow<String?> = dataStore.data.map { preferences ->
        preferences[Keys.authToken]
    }

    suspend fun setAuthToken(token: String) {
        dataStore.edit { preferences ->
            preferences[Keys.authToken] = token
        }
    }

    val userIdFlow: Flow<String?> = dataStore.data.map { preferences ->
        preferences[Keys.userId]
    }

    suspend fun setUserId(userId: String) {
        dataStore.edit { preferences ->
            preferences[Keys.userId] = userId
        }
    }

    val themeModeFlow: Flow<String?> = dataStore.data.map { preferences ->
        preferences[Keys.themeMode]
    }

    suspend fun setThemeMode(themeMode: String) {
        dataStore.edit { preferences ->
            preferences[Keys.themeMode] = themeMode
        }
    }

    suspend fun clearPreferences() {
        dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}
