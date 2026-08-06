package com.starpay.companion.di

import retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.starpay.companion.core.config.AppConfig
import com.starpay.companion.core.config.Constants
import com.starpay.companion.data.remote.api.StarPayApi
import com.starpay.companion.data.remote.interceptor.HmacAuthInterceptor
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(
        hmacAuthInterceptor: HmacAuthInterceptor
    ): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        return OkHttpClient.Builder()
            .addInterceptor(hmacAuthInterceptor)
            .addInterceptor(logging)
            .connectTimeout(Constants.TIMEOUT_CONNECT, TimeUnit.SECONDS)
            .readTimeout(Constants.TIMEOUT_READ, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient, json: Json): Retrofit {
        val contentType = "application/json".toMediaType()
        return Retrofit.Builder()
            .baseUrl(AppConfig.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory(contentType))
            .build()
    }

    @Provides
    @Singleton
    fun provideStarPayApi(retrofit: Retrofit): StarPayApi {
        return retrofit.create(StarPayApi::class.java)
    }
}
