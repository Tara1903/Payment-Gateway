import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { createAdminClient } from '@/lib/supabase/server';
import { appendTimeline } from '@/lib/timeline/logger';
import { appendAuditLog } from '@/lib/audit/logger';
import { z } from 'zod';

const RejectSchema = z.object({ reason: z.string().min(1).max(500) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminRole('SUPPORT');
  if (!auth.ok) return auth.response;

  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { body = {}; }
  const parsed = RejectSchema.safeParse(body);
  const reason = parsed.success ? parsed.data.reason : 'No reason provided';

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
      status: 'REJECTED',
      reviewed_by: auth.userId,
      reviewed_at: now,
    }).eq('id', id),
    supabase.from('orders').update({ status: 'FAILED' }).eq('id', mv.order_id),
  ]);

  await appendTimeline({
    orderId: mv.order_id,
    event: 'MANUAL_REJECTED',
    actorType: 'ADMIN',
    actorId: auth.userId,
    label: 'Manually Rejected',
    description: reason,
    meta: { manualVerificationId: id, reason, reviewedBy: auth.userId },
  });

  await appendAuditLog({
    actorType: 'ADMIN',
    actorId: auth.userId,
    eventType: 'MANUAL_REJECTED',
    entityType: 'order',
    entityId: mv.order_id,
    payload: { manualVerificationId: id, reason },
  });

  return NextResponse.json({ success: true, data: { rejected: true, orderId: mv.order_id } });
}
