package com.starpay.companion.di

import android.content.Context
import androidx.room.Room
import com.starpay.companion.core.config.Constants
import com.starpay.companion.data.local.StarPayDatabase
import com.starpay.companion.data.local.dao.TransactionDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): StarPayDatabase {
        return Room.databaseBuilder(
            context,
            StarPayDatabase::class.java,
            Constants.DATABASE_NAME
        ).build()
    }

    @Provides
    @Singleton
    fun provideTransactionDao(database: StarPayDatabase): TransactionDao {
        return database.transactionDao()
    }
}
