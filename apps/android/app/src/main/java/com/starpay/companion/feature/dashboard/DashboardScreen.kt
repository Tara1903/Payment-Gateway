package com.starpay.companion.feature.dashboard

import android.content.Intent
import android.provider.Settings
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.starpay.companion.domain.model.SyncStatus
import com.starpay.companion.domain.model.Transaction
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(viewModel: DashboardViewModel) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    // Re-check permissions when screen returns from settings
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                viewModel.onEvent(DashboardEvent.OnRefreshPermissions)
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    LaunchedEffect(Unit) {
        viewModel.effect.collect { effect ->
            when (effect) {
                is DashboardEffect.ShowToast -> {
                    Toast.makeText(context, effect.message, Toast.LENGTH_SHORT).show()
                }
                is DashboardEffect.OpenNotificationListenerSettings -> {
                    val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                    context.startActivity(intent)
                }
                is DashboardEffect.OpenBatteryOptimizationSettings -> {
                    val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                    context.startActivity(intent)
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "StarPay Companion",
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp
                        )
                        Text(
                            text = "Payment Gateway Interceptor",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    IconButton(
                        onClick = { viewModel.onEvent(DashboardEvent.OnSyncNowClicked) },
                        enabled = !state.isSyncing
                    ) {
                        if (state.isSyncing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.primary
                            )
                        } else {
                            Text(
                                text = "Sync",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                HealthStatusCard(
                    state = state,
                    onOpenNotificationSettings = {
                        viewModel.onEvent(DashboardEvent.OnOpenNotificationListenerClicked)
                    },
                    onOpenBatterySettings = {
                        viewModel.onEvent(DashboardEvent.OnOpenBatterySettingsClicked)
                    }
                )
            }

            item {
                MerchantDetailsCard(
                    merchant = state.merchant,
                    isLoading = state.isMerchantLoading,
                    onEditClicked = { viewModel.onEvent(DashboardEvent.OnToggleMerchantDialog) }
                )
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Intercepted Transactions",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = "${state.transactions.size} Total",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            if (state.transactions.isEmpty()) {
                item {
                    EmptyTransactionsCard()
                }
            } else {
                items(
                    items = state.transactions,
                    key = { it.id }
                ) { transaction ->
                    TransactionItemCard(transaction = transaction)
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
        
        if (state.showMerchantDialog) {
            EditMerchantDialog(
                merchant = state.merchant,
                isLoading = state.isMerchantLoading,
                onDismiss = { viewModel.onEvent(DashboardEvent.OnToggleMerchantDialog) },
                onSave = { upiId, bankAccount, bankIfsc ->
                    viewModel.onEvent(DashboardEvent.OnUpdateMerchant(upiId, bankAccount, bankIfsc))
                }
            )
        }
    }
}

@Composable
fun HealthStatusCard(
    state: DashboardState,
    onOpenNotificationSettings: () -> Unit,
    onOpenBatterySettings: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Service Health",
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            ServiceStatusRow(
                title = "SMS Capture Service",
                isOk = state.isSmsPermissionGranted,
                okText = "Active",
                warningText = "Permission Missing",
                onClick = {}
            )

            ServiceStatusRow(
                title = "Notification Listener",
                isOk = state.isNotificationListenerGranted,
                okText = "Connected",
                warningText = "Grant Permission",
                onClick = onOpenNotificationSettings
            )

            ServiceStatusRow(
                title = "Battery Optimization",
                isOk = state.isBatteryOptimizationIgnored,
                okText = "Disabled (Optimal)",
                warningText = "Ignore Optimization",
                onClick = onOpenBatterySettings
            )
        }
    }
}

@Composable
fun ServiceStatusRow(
    title: String,
    isOk: Boolean,
    okText: String,
    warningText: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .clickable(enabled = !isOk, onClick = onClick)
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium
        )

        Surface(
            shape = CircleShape,
            color = if (isOk) Color(0xFF10B981).copy(alpha = 0.15f) else Color(0xFFF59E0B).copy(alpha = 0.15f)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .background(
                            color = if (isOk) Color(0xFF10B981) else Color(0xFFF59E0B),
                            shape = CircleShape
                        )
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = if (isOk) okText else warningText,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isOk) Color(0xFF10B981) else Color(0xFFF59E0B)
                )
            }
        }
    }
}

@Composable
fun TransactionItemCard(transaction: Transaction) {
    val currencyFormatter = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    val formattedAmount = try {
        currencyFormatter.format(transaction.amount)
    } catch (e: Exception) {
        "₹${transaction.amount}"
    }

    val timeFormatter = SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault())
    val formattedTime = timeFormatter.format(Date(transaction.timestamp))

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = formattedAmount,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.primary
                )

                SyncBadge(status = transaction.syncStatus)
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "From: ${transaction.sender}",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = formattedTime,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (!transaction.referenceId.isNull_or_empty_compat()) {
                Text(
                    text = "Ref/UTR: ${transaction.referenceId}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.secondary
                )
            }
        }
    }
}

private fun String?.isNull_or_empty_compat(): Boolean = this == null || this.trim().isEmpty()

@Composable
fun SyncBadge(status: SyncStatus) {
    val (bgColor, textColor, label) = when (status) {
        SyncStatus.SYNCED -> Triple(Color(0xFF10B981).copy(alpha = 0.15f), Color(0xFF10B981), "SYNCED")
        SyncStatus.PENDING -> Triple(Color(0xFFF59E0B).copy(alpha = 0.15f), Color(0xFFF59E0B), "PENDING")
        SyncStatus.FAILED -> Triple(Color(0xFFEF4444).copy(alpha = 0.15f), Color(0xFFEF4444), "FAILED")
    }

    Surface(
        shape = RoundedCornerShape(6.dp),
        color = bgColor
    ) {
        Text(
            text = label,
            fontSize = 10.sp,
            fontWeight = FontWeight.ExtraBold,
            color = textColor,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

@Composable
fun EmptyTransactionsCard() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 16.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "No Transactions Intercepted Yet",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "When your bank sends an SMS or payment notification, it will appear here automatically in real time.",
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                lineHeight = 18.sp
            )
        }
    }
}
