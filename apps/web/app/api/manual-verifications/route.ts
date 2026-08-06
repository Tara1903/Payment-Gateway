import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyOrderToken } from '@/lib/crypto/token';
import { ManualVerificationSchema } from '@starpay/shared';
import { appendTimeline } from '@/lib/timeline/logger';
import { appendAuditLog } from '@/lib/audit/logger';

export async function POST(request: NextRequest) {
  const token = request.headers.get('X-Payment-Token');
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Payment token required' } },
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

  const parsed = ManualVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { orderId, utrEntered, screenshotUrl, notes } = parsed.data;

  const payload = await verifyOrderToken(token);
  if (!payload || payload.orderId !== orderId) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid payment token for this order' } },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();

  // Check order is in a state that accepts manual verification
  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single();

  if (!order) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } },
      { status: 404 }
    );
  }

  if (order.status === 'PAID') {
    return NextResponse.json(
      { success: false, error: { code: 'ALREADY_PAID', message: 'Order is already paid' } },
      { status: 409 }
    );
  }

  // Check for duplicate submission
  const { data: existing } = await supabase
    .from('manual_verifications')
    .select('id')
    .eq('order_id', orderId)
    .eq('status', 'PENDING')
    .single();

  if (existing) {
    return NextResponse.json(
      { success: false, error: { code: 'ALREADY_SUBMITTED', message: 'A manual verification is already pending for this order' } },
      { status: 409 }
    );
  }

  // Insert manual verification
  const { data: mv, error: mvErr } = await supabase
    .from('manual_verifications')
    .insert({
      order_id: orderId,
      utr_entered: utrEntered ?? null,
      screenshot_url: screenshotUrl ?? null,
      notes: notes ?? null,
      status: 'PENDING',
    })
    .select('id')
    .single();

  if (mvErr || !mv) {
    return NextResponse.json(
      { success: false, error: { code: 'SUBMISSION_FAILED', message: mvErr?.message ?? 'Failed to submit' } },
      { status: 500 }
    );
  }

  // Update order to PENDING_VERIFICATION
  await supabase.from('orders').update({ status: 'PENDING_VERIFICATION' }).eq('id', orderId);

  await appendTimeline({
    orderId,
    event: 'MANUAL_SUBMITTED',
    actorType: 'CUSTOMER',
    label: 'Customer Submitted Payment Details',
    description: utrEntered ? `UTR: ${utrEntered}` : 'Screenshot submitted',
    meta: { manualVerificationId: mv.id, utrEntered: utrEntered ?? null, hasScreenshot: !!screenshotUrl },
  });

  await appendAuditLog({
    actorType: 'CUSTOMER',
    eventType: 'MANUAL_SUBMITTED',
    entityType: 'order',
    entityId: orderId,
    payload: { manualVerificationId: mv.id, utrEntered: utrEntered ?? null },
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ success: true, data: { manualVerificationId: mv.id, status: 'PENDING' } }, { status: 201 });
}
