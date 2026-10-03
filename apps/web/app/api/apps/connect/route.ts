import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { resolveAppName } from '@/lib/utils/resolveApp';

export const dynamic = 'force-dynamic';

const ConnectAppSchema = z.object({
  appName: z.string().min(1).max(100),
  webhookUrl: z.string().url().optional(),
  returnUrl: z.string().url().optional(),
  description: z.string().max(255).optional(),
});

export async function POST(request: NextRequest) {
  // Verify API Key
  const apiKey = request.headers.get('X-API-Key') ?? request.headers.get('authorization')?.replace('Bearer ', '');
  const validKey = process.env.STARPAY_INTERNAL_API_KEY || process.env.INTERNAL_API_KEY;

  if (!apiKey || (validKey && apiKey !== validKey)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Valid API Key required in X-API-Key header' } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const parsed = ConnectAppSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { appName, webhookUrl, returnUrl, description } = parsed.data;
  const canonicalName = resolveAppName({ businessName: appName, webhookUrl, returnUrl, description });

  const supabase = createAdminClient();
  const { data: merchant } = await supabase.from('merchants').select('name, upi_id').eq('is_active', true).single();

  return NextResponse.json({
    success: true,
    message: `App '${canonicalName}' is connected to StarPay Payment Gateway.`,
    gateway: {
      name: merchant?.name ?? process.env.MERCHANT_NAME ?? 'Hari Singh',
      upiId: merchant?.upi_id ?? process.env.MERCHANT_UPI_ID ?? '9630937033@sbi',
      status: 'active',
      endpoints: {
        createOrder: '/api/orders',
        checkOrder: '/api/orders/{orderId}',
        qrIntent: '/api/orders/{orderId}/qr',
      },
    },
    app: {
      name: canonicalName,
      webhookUrl: webhookUrl ?? null,
      returnUrl: returnUrl ?? null,
      status: 'connected',
    },
  });
}
