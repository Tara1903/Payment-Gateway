import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyOrderToken } from '@/lib/crypto/token';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const token = request.headers.get('X-Payment-Token') ??
    request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Payment token required' } },
      { status: 401 }
    );
  }

  const payload = await verifyOrderToken(token);
  if (!payload || payload.orderId !== orderId) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired payment token' } },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, order_ref, amount, reserved_amount, currency, description, status, upi_txn_ref, expires_at, paid_at, created_at, return_url, webhook_url')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } },
      { status: 404 }
    );
  }

  // Auto-expire check
  if (
    order.status === 'AWAITING_PAYMENT' &&
    order.expires_at &&
    new Date(order.expires_at) < new Date()
  ) {
    await supabase
      .from('orders')
      .update({ status: 'FAILED' })
      .eq('id', orderId);
    order.status = 'FAILED';
  }

  return NextResponse.json({
    success: true,
    data: {
      orderId: order.id,
      orderRef: order.order_ref,
      amount: order.amount,
      reservedAmount: order.reserved_amount,
      currency: order.currency,
      description: order.description,
      status: order.status,
      upiTxnRef: order.upi_txn_ref,
      expiresAt: order.expires_at,
      paidAt: order.paid_at,
      returnUrl: order.return_url,
      webhookUrl: order.webhook_url,
      createdAt: order.created_at,
    },
  });
}
