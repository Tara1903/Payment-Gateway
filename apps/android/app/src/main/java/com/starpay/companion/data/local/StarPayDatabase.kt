package com.starpay.companion.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

import com.starpay.companion.data.local.dao.TransactionDao
import com.starpay.companion.data.local.entity.TransactionEntity

@Database(entities = [TransactionEntity::class], version = 1, exportSchema = false)
abstract class StarPayDatabase : RoomDatabase() {
    abstract fun transactionDao(): TransactionDao
}
