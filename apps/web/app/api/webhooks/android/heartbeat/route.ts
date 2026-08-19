import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/crypto/webhook';
import { z } from 'zod';

const HeartbeatSchema = z.object({
  deviceId: z.string().min(1),
  batteryLevel: z.number().min(0).max(100),
  appVersion: z.string(),
  queueDepth: z.number().min(0).default(0),
  timestamp: z.string(),
});

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const timestamp = request.headers.get('X-StarPay-Timestamp') || request.headers.get('X-Timestamp');
  const signature = request.headers.get('X-StarPay-Signature') || request.headers.get('X-Signature');
  const deviceId = request.headers.get('X-Device-ID');

  if (!timestamp || !signature || !deviceId) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_HEADERS', message: 'Required headers missing' } },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Look up device
  const { data: device } = await supabase
    .from('android_devices')
    .select('id, merchant_id, is_active, merchants(webhook_secret)')
    .eq('device_id', deviceId)
    .single();

  if (!device) {
    // Auto-register the device on first heartbeat (trusted device workflow)
    let body: unknown;
    try { body = JSON.parse(rawBody); } catch { body = {}; }
    const parsed = HeartbeatSchema.safeParse(body);

    // Find the active merchant
    const { data: merchant } = await supabase.from('merchants').select('id').eq('is_active', true).single();
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_MERCHANT', message: 'No active merchant' } },
        { status: 500 }
      );
    }

    await supabase.from('android_devices').insert({
      merchant_id: merchant.id,
      device_id: deviceId,
      device_name: `Android Device (${deviceId.slice(0, 6)})`,
      last_heartbeat: new Date().toISOString(),
      battery_level: parsed.success ? parsed.data.batteryLevel : null,
      app_version: parsed.success ? parsed.data.appVersion : null,
      queue_depth: parsed.success ? parsed.data.queueDepth : 0,
      is_active: true,
    });

    return NextResponse.json({ success: true, data: { registered: true } });
  }

  // Verify signature for known devices
  const merchant = device.merchants as unknown as { webhook_secret: string } | null;
  if (merchant) {
    const { valid } = verifyWebhookSignature({
      timestamp,
      signature,
      rawBody,
      secret: merchant.webhook_secret,
    });
    if (!valid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_SIGNATURE', message: 'Signature verification failed' } },
        { status: 401 }
      );
    }
  }

  // Parse body
  let body: unknown;
  try { body = JSON.parse(rawBody); } catch { body = {}; }
  const parsed = HeartbeatSchema.safeParse(body);

  // Update device
  await supabase.from('android_devices').update({
    last_heartbeat: new Date().toISOString(),
    battery_level: parsed.success ? parsed.data.batteryLevel : null,
    app_version: parsed.success ? parsed.data.appVersion : null,
    queue_depth: parsed.success ? parsed.data.queueDepth : 0,
  }).eq('id', device.id);

  return NextResponse.json({ success: true, data: { acknowledged: true } });
}
