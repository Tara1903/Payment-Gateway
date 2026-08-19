import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/crypto/webhook';
import { z } from 'zod';

const UpdateMerchantSchema = z.object({
  upi_id: z.string().min(1).optional(),
  bank_account: z.string().optional(),
  bank_ifsc: z.string().optional(),
});

async function authenticateDevice(request: NextRequest, rawBody?: string) {
  const timestamp = request.headers.get('X-StarPay-Timestamp') || request.headers.get('X-Timestamp');
  const signature = request.headers.get('X-StarPay-Signature') || request.headers.get('X-Signature');
  const deviceId = request.headers.get('X-Device-ID');

  if (!timestamp || !signature || !deviceId) {
    return { error: NextResponse.json({ success: false, error: { code: 'MISSING_HEADERS', message: 'Required headers missing' } }, { status: 400 }) };
  }

  const supabase = createAdminClient();
  let { data: device } = await supabase
    .from('android_devices')
    .select('id, merchant_id, merchants(webhook_secret)')
    .eq('device_id', deviceId)
    .single();

  if (!device) {
    // Auto-register device
    const { data: activeMerchant } = await supabase.from('merchants').select('id, webhook_secret').eq('is_active', true).single();
    if (activeMerchant) {
      await supabase.from('android_devices').insert({
        merchant_id: activeMerchant.id,
        device_id: deviceId,
        device_name: `Android Device (${deviceId.slice(0, 6)})`,
        is_active: true,
      });
      device = { id: 'new', merchant_id: activeMerchant.id, merchants: { webhook_secret: activeMerchant.webhook_secret } } as any;
    } else {
      return { error: NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unknown device and no active merchant' } }, { status: 401 }) };
    }
  }

  const merchant = device.merchants as unknown as { webhook_secret: string } | null;
  if (!merchant) {
    return { error: NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Device not linked to merchant' } }, { status: 500 }) };
  }

  if (rawBody) {
    const { valid } = verifyWebhookSignature({
      timestamp,
      signature,
      rawBody,
      secret: merchant.webhook_secret,
    });
    if (!valid) {
      return { error: NextResponse.json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Signature verification failed' } }, { status: 401 }) };
    }
  }

  return { supabase, deviceId, merchantId: device.merchant_id };
}

export async function GET(request: NextRequest) {
  const auth = await authenticateDevice(request);
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase!
    .from('merchants')
    .select('name, upi_id, bank_account, bank_ifsc')
    .eq('id', auth.merchantId!)
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: NextRequest) {
  const rawBody = await request.text();
  const auth = await authenticateDevice(request, rawBody);
  if (auth.error) return auth.error;

  let body: unknown;
  try { body = JSON.parse(rawBody); } catch { body = {}; }
  
  const parsed = UpdateMerchantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid payload' } }, { status: 400 });
  }

  const { data, error } = await auth.supabase!
    .from('merchants')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', auth.merchantId!)
    .select('name, upi_id, bank_account, bank_ifsc')
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
