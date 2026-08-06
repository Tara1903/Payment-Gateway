import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { appendTimeline } from '@/lib/timeline/logger';
import { appendAuditLog } from '@/lib/audit/logger';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('X-Cron-Secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();

  // Find all AWAITING_PAYMENT orders that have expired
  const { data: expiredOrders, error } = await supabase
    .from('orders')
    .select('id, order_ref, amount')
    .eq('status', 'AWAITING_PAYMENT')
    .lt('expires_at', new Date().toISOString());

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  if (!expiredOrders?.length) {
    return NextResponse.json({ success: true, data: { expired: 0 } });
  }

  const results = await Promise.allSettled(
    expiredOrders.map(async (order) => {
      await supabase.from('orders').update({ status: 'FAILED' }).eq('id', order.id);
      await appendTimeline({
        orderId: order.id,
        event: 'ORDER_EXPIRED',
        actorType: 'SYSTEM',
        label: 'Order Expired',
        description: `Order ${order.order_ref} expired without payment`,
        meta: { orderRef: order.order_ref, amount: order.amount },
      });
    })
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;

  await appendAuditLog({
    actorType: 'SYSTEM',
    eventType: 'ORDERS_EXPIRED_CRON',
    entityType: 'system',
    payload: { total: expiredOrders.length, succeeded },
  });

  return NextResponse.json({ success: true, data: { expired: succeeded } });
}
