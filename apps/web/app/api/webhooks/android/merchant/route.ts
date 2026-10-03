import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/crypto/webhook';
import { z } from 'zod';
import { resolveAppName } from '@/lib/utils/resolveApp';

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

  const merchant = device!.merchants as unknown as { webhook_secret: string } | null;
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

  return { supabase, deviceId, merchantId: device!.merchant_id };
}

export async function GET(request: NextRequest) {
  const auth = await authenticateDevice(request);
  if (auth.error) return auth.error;

  const { data: merchantData, error } = await auth.supabase!
    .from('merchants')
    .select('name, upi_id, bank_account, bank_ifsc')
    .eq('id', auth.merchantId!)
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  // Discover connected client apps from orders
  const { data: recentOrders } = await auth.supabase!
    .from('orders')
    .select('metadata, webhook_url, return_url, description, created_at, status')
    .order('created_at', { ascending: false })
    .limit(200);

  const appsMap = new Map<string, { name: string; webhookUrl?: string; totalOrders: number; lastActive?: string; status: string }>();

  if (recentOrders && recentOrders.length > 0) {
    for (const order of recentOrders) {
      const meta = (order.metadata as Record<string, unknown>) ?? {};
      const appName = resolveAppName({
        businessName: meta.businessName as string,
        appName: meta.appName as string,
        metadata: meta,
        webhookUrl: (order as any).webhook_url,
        returnUrl: (order as any).return_url,
        description: (order as any).description,
      });

      const webhook = (order as any).webhook_url || (meta.webhookUrl as string) || (meta.webhook_url as string) || undefined;
      const existing = appsMap.get(appName);
      if (existing) {
        existing.totalOrders += 1;
        if (webhook && !existing.webhookUrl) existing.webhookUrl = webhook;
      } else {
        appsMap.set(appName, {
          name: appName,
          webhookUrl: webhook,
          totalOrders: 1,
          lastActive: order.created_at,
          status: 'Active',
        });
      }
    }
  }

  // Ensure default apps like Sardar Ji are registered
  if (!appsMap.has('Sardar Ji Food Corner')) {
    appsMap.set('Sardar Ji Food Corner', {
      name: 'Sardar Ji Food Corner',
      webhookUrl: 'https://sardar-ji.vercel.app/api/starpay/webhook',
      totalOrders: 0,
      lastActive: new Date().toISOString(),
      status: 'Active',
    });
  }

  const connected_apps = Array.from(appsMap.values());

  return NextResponse.json({
    success: true,
    data: {
      ...merchantData,
      connected_apps,
    },
  });
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
