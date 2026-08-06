package com.starpay.companion

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.starpay.companion.core.logger.StarPayLogger
import com.starpay.companion.core.workers.HeartbeatScheduler
import com.starpay.companion.core.workers.SyncScheduler
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
class StarPayApplication : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()

    override fun onCreate() {
        super.onCreate()
        StarPayLogger.init()
        StarPayLogger.i("StarPayApplication", "Initializing StarPay Companion background schedulers")

        SyncScheduler.schedulePeriodicSync(this)
        HeartbeatScheduler.schedulePeriodicHeartbeat(this)
    }
}
