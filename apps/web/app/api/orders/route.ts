import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { signOrderToken } from '@/lib/crypto/token';
import { generateUpiTxnRef } from '@/lib/upi';
import { appendTimeline } from '@/lib/timeline/logger';
import { appendAuditLog } from '@/lib/audit/logger';
import { MERCHANT } from '@starpay/shared';

const CreateOrderSchema = z.object({
  amount: z.number().positive().multipleOf(0.01),
  currency: z.string().length(3).default('INR'),
  description: z.string().max(255).optional(),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  metadata: z.record(z.unknown()).optional(),
  returnUrl: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  // Auth: require internal API key (for now — server-to-server call from Ayurdhara site)
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 }
    );
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } },
      { status: 400 }
    );
  }

  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { amount, currency, description, customerName, customerEmail, customerPhone, metadata, returnUrl, webhookUrl } = parsed.data;

  const supabase = createAdminClient();

  // 1. Get merchant
  const { data: merchant, error: merchantErr } = await supabase
    .from('merchants')
    .select('id')
    .eq('is_active', true)
    .single();

  if (merchantErr || !merchant) {
    return NextResponse.json(
      { success: false, error: { code: 'NO_MERCHANT', message: 'No active merchant found' } },
      { status: 500 }
    );
  }

  // 2. Upsert customer
  let customerId: string | null = null;
  if (customerEmail || customerPhone) {
    const { data: customer } = await supabase
      .from('customers')
      .upsert(
        { name: customerName ?? null, email: customerEmail ?? null, phone: customerPhone ?? null },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id')
      .single();
    customerId = customer?.id ?? null;
  }

  // 3. Reserve unique amount (DB function handles collision retry)
  const { data: reservedData, error: reserveErr } = await supabase
    .rpc('reserve_unique_amount', { p_base_amount: amount });

  if (reserveErr || !reservedData) {
    return NextResponse.json(
      { success: false, error: { code: 'AMOUNT_RESERVE_FAILED', message: 'Could not reserve a unique payment amount. Try again.' } },
      { status: 500 }
    );
  }

  const reservedAmount = Number(reservedData);

  // 4. Generate order ref (sequence from DB)
  const { data: seqData } = await supabase.rpc('next_order_sequence');
  const sequence = Number(seqData ?? 1);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const orderRef = `${MERCHANT.ORDER_REF_PREFIX}-${dateStr}-${sequence.toString().padStart(4, '0')}`;

  // 5. Generate UPI txn ref
  const upiTxnRef = generateUpiTxnRef();

  // 6. Set expiry (30 min from now)
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  // 7. Insert order (without token first — need ID for token)
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      merchant_id: merchant.id,
      customer_id: customerId,
      order_ref: orderRef,
      amount,
      reserved_amount: reservedAmount,
      currency,
      description: description ?? null,
      status: 'CREATED',
      payment_token: 'PENDING', // temporary
      upi_txn_ref: upiTxnRef,
      expires_at: expiresAt,
      metadata: metadata ?? {},
      return_url: returnUrl ?? null,
      webhook_url: webhookUrl ?? null,
    })
    .select('id')
    .single();

  if (orderErr || !order) {
    return NextResponse.json(
      { success: false, error: { code: 'ORDER_CREATE_FAILED', message: orderErr?.message ?? 'Failed to create order' } },
      { status: 500 }
    );
  }

  // 8. Sign JWT with order ID now that we have it
  const paymentToken = await signOrderToken({ orderId: order.id, merchantId: merchant.id });

  // 9. Update order with real token + set status to AWAITING_PAYMENT
  await supabase
    .from('orders')
    .update({ payment_token: paymentToken, status: 'AWAITING_PAYMENT' })
    .eq('id', order.id);

  // 10. Append timeline: ORDER_CREATED
  await appendTimeline({
    orderId: order.id,
    event: 'ORDER_CREATED',
    actorType: 'SYSTEM',
    label: 'Order Created',
    description: `Order ${orderRef} created for ₹${amount.toFixed(2)}`,
    meta: { orderRef, amount, reservedAmount, currency },
  });

  // 11. Audit log
  await appendAuditLog({
    actorType: 'SYSTEM',
    eventType: 'ORDER_CREATED',
    entityType: 'order',
    entityId: order.id,
    payload: { orderRef, amount, reservedAmount, customerId },
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({
    success: true,
    data: {
      orderId: order.id,
      orderRef,
      amount,
      reservedAmount,
      currency,
      paymentToken,
      upiTxnRef,
      expiresAt,
      checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${order.id}`,
    },
  }, { status: 201 });
}
