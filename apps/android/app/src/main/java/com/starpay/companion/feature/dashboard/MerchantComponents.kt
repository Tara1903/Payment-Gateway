package com.starpay.companion.feature.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.starpay.companion.data.remote.model.ConnectedAppDto
import com.starpay.companion.data.remote.model.MerchantDto

@Composable
fun MerchantDetailsCard(
    merchant: MerchantDto?,
    isLoading: Boolean,
    onEditClicked: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Merchant Bank Details",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Button(
                    onClick = onEditClicked,
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                    modifier = Modifier.height(32.dp)
                ) {
                    Text("Edit", fontSize = 12.sp)
                }
            }

            if (isLoading && merchant == null) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp).align(Alignment.CenterHorizontally))
            } else if (merchant != null) {
                MerchantInfoRow("UPI ID", merchant.upi_id ?: "Not set")
                MerchantInfoRow("Bank Account", merchant.bank_account ?: "Not set")
                MerchantInfoRow("IFSC", merchant.bank_ifsc ?: "Not set")
            } else {
                Text("Failed to load details", color = MaterialTheme.colorScheme.error, fontSize = 14.sp)
            }
        }
    }
}

@Composable
fun ConnectedAppsCard(
    merchant: MerchantDto?,
    isLoading: Boolean
) {
    val apps = merchant?.connected_apps ?: emptyList()

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "Connected Client Apps",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)
                    ) {
                        Text(
                            text = "${apps.size} Linked",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            Text(
                text = "All client applications route payments into your single central bank account.",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

            if (isLoading && apps.isEmpty()) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp).align(Alignment.CenterHorizontally),
                    strokeWidth = 2.dp
                )
            } else if (apps.isEmpty()) {
                Text(
                    text = "No client apps connected yet. Any order created via API will automatically appear here.",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                apps.forEach { app ->
                    ConnectedAppItem(app = app)
                }
            }
        }
    }
}

@Composable
fun ConnectedAppItem(app: ConnectedAppDto) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = app.name,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Surface(
                    shape = CircleShape,
                    color = Color(0xFF10B981).copy(alpha = 0.15f)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .background(color = Color(0xFF10B981), shape = CircleShape)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = app.status,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF10B981)
                        )
                    }
                }
            }

            if (!app.webhookUrl.isNullOrBlank()) {
                Text(
                    text = "Webhook: ${app.webhookUrl}",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Processed: ${app.totalOrders} Orders",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.primary
                )
                if (!app.lastActive.isNullOrBlank()) {
                    Text(
                        text = "Active recently",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
private fun MerchantInfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text = value, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.onSurface)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditMerchantDialog(
    merchant: MerchantDto?,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onSave: (upiId: String, bankAccount: String, bankIfsc: String) -> Unit
) {
    var upiId by remember { mutableStateOf(merchant?.upi_id ?: "") }
    var bankAccount by remember { mutableStateOf(merchant?.bank_account ?: "") }
    var bankIfsc by remember { mutableStateOf(merchant?.bank_ifsc ?: "") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Edit Bank Details",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )

                Text(
                    text = "These details determine where payments will be sent.",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                OutlinedTextField(
                    value = upiId,
                    onValueChange = { upiId = it },
                    label = { Text("Primary UPI ID") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = bankAccount,
                    onValueChange = { bankAccount = it },
                    label = { Text("Bank Account (Optional)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = bankIfsc,
                    onValueChange = { bankIfsc = it },
                    label = { Text("IFSC Code (Optional)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp).padding(end = 16.dp))
                    }
                    TextButton(onClick = onDismiss, enabled = !isLoading) {
                        Text("Cancel")
                    }
                    Button(
                        onClick = { onSave(upiId, bankAccount, bankIfsc) },
                        enabled = !isLoading && upiId.isNotBlank()
                    ) {
                        Text("Save")
                    }
                }
            }
        }
    }
}
