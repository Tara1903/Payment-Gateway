import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyOrderToken } from '@/lib/crypto/token';
import { buildUpiUrl, generateQrCode } from '@/lib/upi';
import { appendTimeline } from '@/lib/timeline/logger';

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
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, reserved_amount, description, status, upi_txn_ref, expires_at')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } },
      { status: 404 }
    );
  }

  if (order.status === 'PAID') {
    return NextResponse.json(
      { success: false, error: { code: 'ALREADY_PAID', message: 'Order already paid' } },
      { status: 409 }
    );
  }

  if (order.expires_at && new Date(order.expires_at) < new Date()) {
    return NextResponse.json(
      { success: false, error: { code: 'EXPIRED', message: 'Order has expired' } },
      { status: 410 }
    );
  }

  const merchantUpiId = process.env.MERCHANT_UPI_ID ?? 'ayurdhara@upi';
  const upiUrl = buildUpiUrl({
    amount: order.reserved_amount,
    txnRef: order.upi_txn_ref ?? orderId.slice(0, 12),
    description: order.description ?? 'Payment to Ayurdhara',
    upiId: merchantUpiId,
  });

  const [qrDataUrl] = await Promise.all([
    generateQrCode(upiUrl),
    appendTimeline({
      orderId,
      event: 'QR_GENERATED',
      actorType: 'SYSTEM',
      label: 'QR Code Generated',
      description: `Payment QR generated for ₹${order.reserved_amount.toFixed(2)}`,
      meta: { amount: order.reserved_amount, upiId: merchantUpiId },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      qrDataUrl,
      upiUrl,
      upiId: merchantUpiId,
      amount: order.reserved_amount,
      expiresAt: order.expires_at,
    },
  });
}
