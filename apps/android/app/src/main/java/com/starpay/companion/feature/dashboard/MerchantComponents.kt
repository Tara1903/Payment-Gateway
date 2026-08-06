package com.starpay.companion.feature.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
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
