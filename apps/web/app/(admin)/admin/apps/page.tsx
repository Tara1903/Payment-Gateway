import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { redirect } from 'next/navigation';
import { formatDateTime, formatCurrency } from '@starpay/shared';

export const metadata: Metadata = { title: 'Connected Apps' };
export const dynamic = 'force-dynamic';

function isRecentlyActive(lastActive: string | null): boolean {
  if (!lastActive) return false;
  return Date.now() - new Date(lastActive).getTime() < 7 * 24 * 60 * 60 * 1000;
}

export default async function AppsPage() {
  const auth = await requireAdminRole('READ_ONLY');
  if (!auth.ok) redirect('/admin/login');

  const supabase = createAdminClient();

  // Fetch orders with metadata + amounts for aggregation
  const { data: orders } = await supabase
    .from('orders')
    .select('id, metadata, amount, status, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  // Aggregate per app
  const appMap = new Map<string, {
    totalOrders: number;
    paidOrders: number;
    totalRevenue: number;
    lastActive: string | null;
    recentOrderIds: string[];
  }>();

  for (const order of orders ?? []) {
    const m = order.metadata as Record<string, unknown> | null;
    const name = (m?.businessName ?? m?.appName) as string | undefined;
    if (!name) continue;
    const existing = appMap.get(name);
    if (!existing) {
      appMap.set(name, {
        totalOrders: 1,
        paidOrders: order.status === 'PAID' ? 1 : 0,
        totalRevenue: order.status === 'PAID' ? Number(order.amount) : 0,
        lastActive: order.created_at as string,
        recentOrderIds: [order.id],
      });
    } else {
      existing.totalOrders += 1;
      if (order.status === 'PAID') {
        existing.paidOrders += 1;
        existing.totalRevenue += Number(order.amount);
      }
      if (!existing.lastActive || (order.created_at as string) > existing.lastActive) {
        existing.lastActive = order.created_at as string;
      }
      if (existing.recentOrderIds.length < 5) existing.recentOrderIds.push(order.id);
    }
  }

  const apps = Array.from(appMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => (b.lastActive ?? '').localeCompare(a.lastActive ?? ''));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'rgb(248 250 252)' }}>Connected Apps</h1>
        <p className="text-sm mt-1" style={{ color: 'rgb(100 116 139)' }}>
          {apps.length} app{apps.length !== 1 ? 's' : ''} routing payments through this gateway
        </p>
      </div>

      {apps.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: 'rgb(13 17 37)', border: '1px solid rgb(255 255 255 / 0.06)' }}
        >
          <p className="text-4xl mb-3">🔗</p>
          <p style={{ color: 'rgb(148 163 184)' }}>No apps connected yet.</p>
          <p className="text-sm mt-2" style={{ color: 'rgb(71 85 105)' }}>
            Apps appear here once they create their first order with a <code>businessName</code> field.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {apps.map((app) => {
            const active = isRecentlyActive(app.lastActive);
            const conversionRate = app.totalOrders > 0
              ? Math.round((app.paidOrders / app.totalOrders) * 100)
              : 0;

            return (
              <div
                key={app.name}
                className="rounded-2xl p-5 flex flex-col gap-4"
                style={{ background: 'rgb(13 17 37)', border: '1px solid rgb(255 255 255 / 0.06)' }}
              >
                {/* App header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: 'rgb(139 92 246 / 0.12)' }}
                    >
                      📦
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'rgb(248 250 252)' }}>{app.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgb(71 85 105)' }}>
                        {app.lastActive ? `Last active ${formatDateTime(app.lastActive)}` : 'No activity'}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: active ? 'rgb(52 211 153 / 0.12)' : 'rgb(100 116 139 / 0.12)',
                      color: active ? 'rgb(52 211 153)' : 'rgb(100 116 139)',
                    }}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1 mb-0.5"
                      style={{ background: active ? 'rgb(52 211 153)' : 'rgb(100 116 139)' }}
                    />
                    {active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className="rounded-xl p-3 text-center"
                    style={{ background: 'rgb(255 255 255 / 0.03)' }}
                  >
                    <p className="text-lg font-bold font-mono" style={{ color: 'rgb(248 250 252)' }}>
                      {app.totalOrders}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgb(71 85 105)' }}>Orders</p>
                  </div>
                  <div
                    className="rounded-xl p-3 text-center"
                    style={{ background: 'rgb(255 255 255 / 0.03)' }}
                  >
                    <p className="text-lg font-bold font-mono" style={{ color: 'rgb(52 211 153)' }}>
                      {app.paidOrders}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgb(71 85 105)' }}>Paid</p>
                  </div>
                  <div
                    className="rounded-xl p-3 text-center"
                    style={{ background: 'rgb(255 255 255 / 0.03)' }}
                  >
                    <p className="text-lg font-bold font-mono" style={{ color: 'rgb(139 92 246)' }}>
                      {conversionRate}%
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgb(71 85 105)' }}>Conv.</p>
                  </div>
                </div>

                {/* Revenue */}
                <div
                  className="rounded-xl p-3 flex items-center justify-between"
                  style={{ background: 'rgb(52 211 153 / 0.05)', border: '1px solid rgb(52 211 153 / 0.1)' }}
                >
                  <p className="text-xs" style={{ color: 'rgb(100 116 139)' }}>Total Revenue</p>
                  <p className="font-bold font-mono text-sm" style={{ color: 'rgb(52 211 153)' }}>
                    {formatCurrency(app.totalRevenue)}
                  </p>
                </div>

                {/* View orders link */}
                <a
                  href={`/admin/orders?app=${encodeURIComponent(app.name)}`}
                  className="text-xs font-medium text-center py-2 rounded-xl transition-all"
                  style={{ background: 'rgb(139 92 246 / 0.1)', color: 'rgb(167 139 250)' }}
                >
                  View Orders →
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
