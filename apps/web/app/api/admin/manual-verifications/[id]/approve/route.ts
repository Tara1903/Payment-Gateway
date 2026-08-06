import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { createAdminClient } from '@/lib/supabase/server';
import { appendTimeline } from '@/lib/timeline/logger';
import { appendAuditLog } from '@/lib/audit/logger';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminRole('SUPPORT');
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: mv, error } = await supabase
    .from('manual_verifications')
    .select('id, order_id, status')
    .eq('id', id)
    .single();

  if (error || !mv) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Manual verification not found' } },
      { status: 404 }
    );
  }

  if (mv.status !== 'PENDING') {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_STATE', message: `Already ${mv.status.toLowerCase()}` } },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();

  await Promise.all([
    supabase.from('manual_verifications').update({
      status: 'APPROVED',
      reviewed_by: auth.userId,
      reviewed_at: now,
    }).eq('id', id),
    supabase.from('orders').update({ status: 'PAID', paid_at: now }).eq('id', mv.order_id),
  ]);

  await appendTimeline({
    orderId: mv.order_id,
    event: 'MANUAL_APPROVED',
    actorType: 'ADMIN',
    actorId: auth.userId,
    label: 'Manually Approved by Admin',
    description: 'Payment manually approved after review',
    meta: { manualVerificationId: id, reviewedBy: auth.userId, reviewedAt: now },
  });

  await appendAuditLog({
    actorType: 'ADMIN',
    actorId: auth.userId,
    eventType: 'MANUAL_APPROVED',
    entityType: 'order',
    entityId: mv.order_id,
    payload: { manualVerificationId: id, role: auth.role },
  });

  return NextResponse.json({ success: true, data: { approved: true, orderId: mv.order_id } });
}
