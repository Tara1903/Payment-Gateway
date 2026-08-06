import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { redirect } from 'next/navigation';
import { formatCurrency, formatDateTime } from '@starpay/shared';

export const metadata: Metadata = { title: 'Verifications' };
export const dynamic = 'force-dynamic';

export default async function VerificationsPage() {
  const auth = await requireAdminRole('SUPPORT');
  if (!auth.ok) redirect('/admin/login');

  const supabase = createAdminClient();
  const { data: pending } = await supabase
    .from('manual_verifications')
    .select('id, order_id, utr_entered, screenshot_url, notes, status, created_at, orders(order_ref, amount, currency)')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: true });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'rgb(248 250 252)' }}>Manual Verifications</h1>
      <p className="text-sm mb-8" style={{ color: 'rgb(100 116 139)' }}>{pending?.length ?? 0} pending review</p>

      {!pending?.length ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p style={{ color: 'rgb(148 163 184)' }}>No pending verifications. All clear!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map((mv) => {
            const order = mv.orders as unknown as { order_ref: string; amount: number; currency: string } | null;
            return (
              <div key={mv.id} className="card p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-mono font-medium" style={{ color: 'rgb(167 139 250)' }}>{order?.order_ref ?? mv.order_id}</p>
                    <p className="text-sm mt-0.5" style={{ color: 'rgb(100 116 139)' }}>Submitted {formatDateTime(mv.created_at)}</p>
                  </div>
                  {order && <p className="font-bold font-mono" style={{ color: 'rgb(248 250 252)' }}>{formatCurrency(order.amount)}</p>}
                </div>

                {mv.utr_entered && (
                  <div className="mb-3">
                    <p className="text-xs mb-1" style={{ color: 'rgb(71 85 105)' }}>UTR Submitted</p>
                    <p className="font-mono text-sm" style={{ color: 'rgb(248 250 252)' }}>{mv.utr_entered}</p>
                  </div>
                )}
                {mv.notes && (
                  <p className="text-sm mb-4" style={{ color: 'rgb(148 163 184)' }}>{mv.notes}</p>
                )}

                <div className="flex gap-3 mt-4">
                  <form action={`/api/admin/manual-verifications/${mv.id}/approve`} method="POST">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'rgb(52 211 153 / 0.15)', color: 'rgb(52 211 153)', border: '1px solid rgb(52 211 153 / 0.3)' }}
                    >
                      ✔ Approve
                    </button>
                  </form>
                  <form action={`/api/admin/manual-verifications/${mv.id}/reject`} method="POST">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'rgb(248 113 113 / 0.1)', color: 'rgb(248 113 113)', border: '1px solid rgb(248 113 113 / 0.25)' }}
                    >
                      ✕ Reject
                    </button>
                  </form>
                  <a
                    href={`/admin/orders/${mv.order_id}`}
                    className="px-4 py-2 rounded-xl text-sm transition-all"
                    style={{ background: 'rgb(255 255 255 / 0.04)', color: 'rgb(148 163 184)', border: '1px solid rgb(255 255 255 / 0.08)' }}
                  >
                    View Order
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
