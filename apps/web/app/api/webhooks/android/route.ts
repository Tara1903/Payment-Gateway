import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/crypto/webhook';
import { AndroidWebhookSchema } from '@starpay/shared';
import { appendTimeline } from '@/lib/timeline/logger';
import { appendAuditLog } from '@/lib/audit/logger';
import { runVerificationPipeline } from '@/lib/verification/pipeline';

export async function POST(request: NextRequest) {
  // 1. Read raw body for HMAC verification
  const rawBody = await request.text();

  const timestamp = request.headers.get('X-StarPay-Timestamp');
  const signature = request.headers.get('X-StarPay-Signature');
  const deviceId = request.headers.get('X-Device-ID');

  if (!timestamp || !signature || !deviceId) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_HEADERS', message: 'X-StarPay-Timestamp, X-StarPay-Signature, X-Device-ID are required' } },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // 2. Look up device + merchant to get webhook secret
  const { data: device, error: deviceErr } = await supabase
    .from('android_devices')
    .select('id, merchant_id, is_active, merchants(webhook_secret)')
    .eq('device_id', deviceId)
    .single();

  if (deviceErr || !device || !device.is_active) {
    await appendAuditLog({
      actorType: 'ANDROID',
      actorId: deviceId,
      eventType: 'WEBHOOK_REJECTED',
      entityType: 'webhook',
      payload: { reason: 'device_not_found_or_inactive', deviceId },
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    });
    return NextResponse.json(
      { success: false, error: { code: 'DEVICE_NOT_FOUND', message: 'Device not registered or inactive' } },
      { status: 401 }
    );
  }

  // 3. Verify HMAC signature
  const merchant = device.merchants as unknown as { webhook_secret: string };
  const { valid, reason } = verifyWebhookSignature({
    timestamp,
    signature,
    rawBody,
    secret: merchant.webhook_secret,
  });

  if (!valid) {
    await appendAuditLog({
      actorType: 'ANDROID',
      actorId: deviceId,
      eventType: 'WEBHOOK_REJECTED',
      entityType: 'webhook',
      payload: { reason, deviceId },
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    });
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_SIGNATURE', message: reason ?? 'Signature verification failed' } },
      { status: 401 }
    );
  }

  // 4. Parse and validate body
  let body: unknown;
  try { body = JSON.parse(rawBody); } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } },
      { status: 400 }
    );
  }

  const parsed = AndroidWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
      { status: 400 }
    );
  }

  const payload = parsed.data;

  // 5. Audit: webhook received
  await appendAuditLog({
    actorType: 'ANDROID',
    actorId: deviceId,
    eventType: 'WEBHOOK_RECEIVED',
    entityType: 'webhook',
    payload: { deviceId, eventType: payload.eventType, amount: payload.parsed.amount, utr: payload.parsed.utr },
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
  });

  // 6. Insert raw transaction record
  const { data: txn, error: txnErr } = await supabase
    .from('transactions')
    .insert({
      merchant_id: device.merchant_id,
      utr: payload.parsed.utr,
      amount: payload.parsed.amount,
      sender_name: payload.parsed.senderName,
      sender_upi: payload.parsed.senderUpi,
      bank_ref: payload.parsed.bankRef,
      payment_mode: 'UPI',
      source: payload.source,
      raw_payload: { raw: payload.raw, parsed: payload.parsed },
      status: 'RECEIVED',
    })
    .select('id')
    .single();

  if (txnErr || !txn) {
    // Possible duplicate UTR — handled gracefully
    if (txnErr?.code === '23505') {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_UTR', message: 'Transaction with this UTR already processed' } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'TXN_INSERT_FAILED', message: txnErr?.message ?? 'Failed to record transaction' } },
      { status: 500 }
    );
  }

  // 7. Run verification pipeline asynchronously (do not await — respond immediately to Android)
  // We use waitUntil pattern — just run it without blocking the response
  const pipelineCtx = {
    rawPayload: { raw: payload.raw, parsed: payload.parsed } as Record<string, unknown>,
    parsed: payload.parsed,
    deviceId,
    source: payload.source as 'ANDROID_SMS' | 'ANDROID_NOTIFICATION',
    arrivedAt: new Date().toISOString(),
    transactionId: txn.id,
    merchantId: device.merchant_id,
  };

  // Run pipeline — fire and await (we want real-time response to customer)
  runVerificationPipeline(pipelineCtx).catch((err: unknown) => {
    console.error('[Webhook] Pipeline error:', err);
  });

  return NextResponse.json({ success: true, data: { transactionId: txn.id, status: 'RECEIVED' } });
}
