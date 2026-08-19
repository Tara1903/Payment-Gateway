import { createAdminClient } from '@/lib/supabase/server';
import { appendTimeline } from '@/lib/timeline/logger';
import { appendAuditLog } from '@/lib/audit/logger';
import type { ParsedPayment } from '@starpay/types';
import { checkAmountMatch } from './steps/amountMatch';
import { checkTimeWindow } from './steps/timeWindow';
import { checkUtrUniqueness } from './steps/utrUniqueness';
import { checkFraudRules } from './steps/fraudRules';

export interface PipelineInput {
  rawPayload: Record<string, unknown>;
  parsed: ParsedPayment;
  deviceId: string;
  source: 'ANDROID_SMS' | 'ANDROID_NOTIFICATION';
  arrivedAt: string;
  transactionId: string;
  merchantId: string;
}

export async function runVerificationPipeline(ctx: PipelineInput): Promise<void> {
  const supabase = createAdminClient();

  // --- Step 1: Find matching order by reserved_amount ---
  const { data: order } = await supabase
    .from('orders')
    .select('id, amount, reserved_amount, status, expires_at, upi_txn_ref, webhook_url')
    .eq('reserved_amount', ctx.parsed.amount)
    .eq('status', 'AWAITING_PAYMENT')
    .single();

  if (!order) {
    // No matching order — orphan payment
    await logVerificationEvent(supabase, null, ctx.transactionId, 'ORDER_LOOKUP', 'FAIL',
      `No AWAITING_PAYMENT order found for amount ₹${ctx.parsed.amount}`);
    await handleOrphanPayment(ctx, supabase);
    return;
  }

  const orderId = order.id;

  // Update transaction with matched order_id
  await supabase.from('transactions').update({ order_id: orderId, status: 'VERIFYING' }).eq('id', ctx.transactionId);

  await appendTimeline({
    orderId,
    event: 'ANDROID_EVENT_RECEIVED',
    actorType: 'ANDROID',
    actorId: ctx.deviceId,
    label: 'SMS Received',
    description: `Payment SMS received from Android companion`,
    meta: { utr: ctx.parsed.utr, amount: ctx.parsed.amount, deviceId: ctx.deviceId },
    occurredAt: ctx.parsed.txnTimestamp,
  });

  await appendTimeline({
    orderId,
    event: 'SMS_PARSED',
    actorType: 'ANDROID',
    actorId: ctx.deviceId,
    label: 'Payment Details Extracted',
    description: `UTR: ${ctx.parsed.utr}, Amount: ₹${ctx.parsed.amount}`,
    meta: { utr: ctx.parsed.utr, senderName: ctx.parsed.senderName, senderUpi: ctx.parsed.senderUpi },
  });

  // Set order to VERIFYING
  await supabase.from('orders').update({ status: 'VERIFYING' }).eq('id', orderId);

  await appendTimeline({
    orderId,
    event: 'VERIFICATION_STARTED',
    actorType: 'SYSTEM',
    label: 'Verification Started',
    description: 'Automatic verification pipeline started',
    meta: { transactionId: ctx.transactionId },
  });

  // --- Run pipeline steps ---
  const steps = [
    { name: 'AMOUNT_MATCH', fn: checkAmountMatch, timelineEvent: 'AMOUNT_VERIFIED' as const, label: 'Amount Verified' },
    { name: 'TIME_WINDOW', fn: checkTimeWindow, timelineEvent: 'TIME_WINDOW_CHECKED' as const, label: 'Time Window Checked' },
    { name: 'UTR_UNIQUENESS', fn: checkUtrUniqueness, timelineEvent: 'UTR_UNIQUENESS_CHECKED' as const, label: 'UTR Uniqueness Checked' },
    { name: 'FRAUD_RULES', fn: checkFraudRules, timelineEvent: 'FRAUD_CHECK_PASSED' as const, label: 'Fraud Check Passed' },
  ] as const;

  for (const step of steps) {
    const result = await step.fn({ order, parsed: ctx.parsed, deviceId: ctx.deviceId, merchantId: ctx.merchantId, transactionId: ctx.transactionId });

    await logVerificationEvent(supabase, orderId, ctx.transactionId, step.name, result.result, result.reason ?? null, result.meta);

    if (result.result === 'FAIL') {
      const isFraud = step.name === 'FRAUD_RULES';
      await appendTimeline({
        orderId,
        event: isFraud ? 'FRAUD_CHECK_FAILED' : 'FALLBACK_TRIGGERED',
        actorType: 'SYSTEM',
        label: isFraud ? 'Fraud Check Failed' : 'Verification Failed',
        description: result.reason,
        meta: { step: step.name, ...result.meta },
      });
      await triggerFallback(orderId, ctx.transactionId, step.name, result.reason ?? 'Verification failed', supabase);
      return;
    }

    await appendTimeline({
      orderId,
      event: step.timelineEvent,
      actorType: 'SYSTEM',
      label: step.label,
      description: result.reason,
      meta: result.meta ?? {},
    });
  }

  // --- All steps passed: APPROVE ---
  await approveOrder(orderId, ctx.transactionId, ctx.parsed, order.webhook_url, supabase);
}

async function approveOrder(
  orderId: string,
  transactionId: string,
  parsed: ParsedPayment,
  webhookUrl: string | null,
  supabase: ReturnType<typeof createAdminClient>
) {
  const paidAt = new Date().toISOString();

  await Promise.all([
    supabase.from('orders').update({ status: 'PAID', paid_at: paidAt }).eq('id', orderId),
    supabase.from('transactions').update({ status: 'VERIFIED', verified_at: paidAt }).eq('id', transactionId),
  ]);

  await appendTimeline({
    orderId,
    event: 'APPROVED',
    actorType: 'SYSTEM',
    label: 'Payment Approved',
    description: `Payment of \u20b9${parsed.amount} verified and approved. UTR: ${parsed.utr}`,
    meta: { utr: parsed.utr, amount: parsed.amount, paidAt },
  });

  await appendAuditLog({
    actorType: 'SYSTEM',
    eventType: 'PAYMENT_APPROVED',
    entityType: 'order',
    entityId: orderId,
    payload: { transactionId, utr: parsed.utr, amount: parsed.amount, paidAt },
  });

  // Trigger post-payment notifications (invoice + email) — fire and forget
  import('@/lib/notifications/orderPaid').then(({ sendPaymentApprovedNotifications }) => {
    sendPaymentApprovedNotifications(orderId).catch((err: unknown) => {
      console.error('[Pipeline] Notification error:', err);
    });
  }).catch((err: unknown) => {
    console.error('[Pipeline] Failed to import notifications:', err);
  });

  // Trigger external webhook if configured
  if (webhookUrl) {
    import('@/lib/notifications/webhook').then(({ sendOrderWebhook }) => {
      sendOrderWebhook(orderId, webhookUrl, {
        orderId,
        amount: parsed.amount,
        utr: parsed.utr,
        status: 'PAID',
        paidAt
      }).catch((err: unknown) => {
        console.error('[Pipeline] Webhook error:', err);
      });
    }).catch((err: unknown) => {
      console.error('[Pipeline] Failed to import webhook module:', err);
    });
  }
}

async function triggerFallback(
  orderId: string,
  transactionId: string,
  failedStep: string,
  reason: string,
  supabase: ReturnType<typeof createAdminClient>
) {
  await Promise.all([
    supabase.from('orders').update({ status: 'PENDING_VERIFICATION' }).eq('id', orderId),
    supabase.from('transactions').update({ status: 'REJECTED' }).eq('id', transactionId),
  ]);

  await appendTimeline({
    orderId,
    event: 'FALLBACK_TRIGGERED',
    actorType: 'SYSTEM',
    label: 'Manual Review Required',
    description: `Auto-verification failed at ${failedStep}: ${reason}`,
    meta: { failedStep, reason, transactionId },
  });

  await appendAuditLog({
    actorType: 'SYSTEM',
    eventType: 'FALLBACK_TRIGGERED',
    entityType: 'order',
    entityId: orderId,
    payload: { failedStep, reason, transactionId },
  });
}

async function handleOrphanPayment(
  ctx: PipelineInput,
  supabase: ReturnType<typeof createAdminClient>
) {
  // Raise a fraud flag for unmatched payment
  await supabase.from('fraud_flags').insert({
    transaction_id: ctx.transactionId,
    rule_triggered: 'ORPHAN_PAYMENT',
    severity: 'MEDIUM',
    details: { amount: ctx.parsed.amount, utr: ctx.parsed.utr, deviceId: ctx.deviceId },
  });

  await appendAuditLog({
    actorType: 'ANDROID',
    actorId: ctx.deviceId,
    eventType: 'PAYMENT_FAILED',
    entityType: 'transaction',
    entityId: ctx.transactionId,
    payload: { reason: 'orphan_payment', amount: ctx.parsed.amount, utr: ctx.parsed.utr },
  });
}

async function logVerificationEvent(
  supabase: ReturnType<typeof createAdminClient>,
  orderId: string | null,
  transactionId: string,
  step: string,
  result: 'PASS' | 'FAIL' | 'SKIP',
  reason: string | null,
  meta?: Record<string, unknown>
) {
  await supabase.from('verification_events').insert({
    order_id: orderId,
    transaction_id: transactionId,
    pipeline_step: step,
    result,
    reason,
    meta: meta ?? null,
  });
}
