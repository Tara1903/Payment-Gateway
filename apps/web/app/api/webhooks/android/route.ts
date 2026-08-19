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

  const timestamp = request.headers.get('X-StarPay-Timestamp') || request.headers.get('X-Timestamp');
  const signature = request.headers.get('X-StarPay-Signature') || request.headers.get('X-Signature');
  const deviceId = request.headers.get('X-Device-ID');

  if (!timestamp || !signature || !deviceId) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_HEADERS', message: 'X-StarPay-Timestamp, X-StarPay-Signature, X-Device-ID are required' } },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // 2. Look up device + merchant to get webhook secret
  let { data: device, error: deviceErr } = await supabase
    .from('android_devices')
    .select('id, merchant_id, is_active, merchants(webhook_secret)')
    .eq('device_id', deviceId)
    .single();

  if (deviceErr || !device || !device.is_active) {
    const { data: activeMerchant } = await supabase.from('merchants').select('id, webhook_secret').eq('is_active', true).single();
    if (activeMerchant) {
      await supabase.from('android_devices').insert({
        merchant_id: activeMerchant.id,
        device_id: deviceId,
        device_name: `Android Device (${deviceId.slice(0, 6)})`,
        is_active: true,
      });
      device = { id: 'new', merchant_id: activeMerchant.id, is_active: true, merchants: { webhook_secret: activeMerchant.webhook_secret } } as any;
    } else {
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
  }

  // 3. Verify HMAC signature
  const merchant = device!.merchants as unknown as { webhook_secret: string };
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

  const payload = parsed.data; // this is now an array

  const results = [];
  
  for (const item of payload) {
    // 5. Audit: webhook received
    await appendAuditLog({
      actorType: 'ANDROID',
      actorId: deviceId,
      eventType: 'WEBHOOK_RECEIVED',
      entityType: 'webhook',
      payload: { deviceId, eventType: 'NOTIFICATION_RECEIVED', amount: item.amount, utr: item.referenceId },
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    });

    // 6. Insert raw transaction record
    const { data: txn, error: txnErr } = await supabase
      .from('transactions')
      .insert({
        merchant_id: device!.merchant_id,
        utr: item.referenceId ?? null,
        amount: item.amount,
        sender_name: item.sender,
        sender_upi: null,
        bank_ref: null,
        payment_mode: 'UPI',
        source: 'ANDROID_NOTIFICATION',
        raw_payload: { raw: item.rawMessage, parsed: item },
        status: 'RECEIVED',
      })
      .select('id')
      .single();

    if (txnErr || !txn) {
      if (txnErr?.code === '23505') {
        results.push({ id: item.id, status: 'DUPLICATE' });
        continue;
      }
      console.error('Failed to insert txn', txnErr);
      results.push({ id: item.id, status: 'FAILED' });
      continue;
    }

    // 7. Run verification pipeline
    const pipelineCtx = {
      rawPayload: { raw: item.rawMessage, parsed: item } as Record<string, unknown>,
      parsed: {
        amount: item.amount,
        utr: item.referenceId ?? '',
        senderName: item.sender,
        senderUpi: null,
        bankRef: null,
        txnTimestamp: new Date(item.timestamp).toISOString(),
      },
      deviceId,
      source: 'ANDROID_NOTIFICATION' as const,
      arrivedAt: new Date().toISOString(),
      transactionId: txn.id,
      merchantId: device!.merchant_id,
    };

    runVerificationPipeline(pipelineCtx).catch((err: unknown) => {
      console.error('[Webhook] Pipeline error:', err);
    });
    
    results.push({ id: item.id, status: 'RECEIVED' });
  }

  return NextResponse.json({ success: true, data: results });
}
