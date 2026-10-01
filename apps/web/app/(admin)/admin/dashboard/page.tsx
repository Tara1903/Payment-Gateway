import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { redirect } from 'next/navigation';
import { formatCurrency } from '@starpay/shared';
import { OrdersTable } from '@/components/admin/OrdersTable';
import { MetricCard } from '@/components/admin/MetricCard';
import { DeviceStatus } from '@/components/admin/DeviceStatus';
import { ConnectedAppsCard } from '@/components/admin/ConnectedAppsCard';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const auth = await requireAdminRole('READ_ONLY');
  if (!auth.ok) redirect('/admin/login');

  const supabase = createAdminClient();

  // Fetch metrics in parallel
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: totalOrders },
    { count: paidToday },
    { data: revenueToday },
    { count: pendingVerifications },
    { count: fraudFlags },
    { data: recentOrders },
    { data: devices },
    { data: recentOrdersMeta },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PAID').gte('paid_at', today.toISOString()),
    supabase.from('orders').select('amount').eq('status', 'PAID').gte('paid_at', today.toISOString()),
    supabase.from('manual_verifications').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.from('fraud_flags').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('orders').select('id, order_ref, amount, reserved_amount, status, paid_at, created_at, metadata, customers(name, email)').order('created_at', { ascending: false }).limit(10),
    supabase.from('android_devices').select('id, device_name, last_heartbeat, battery_level, is_active, app_version').eq('is_active', true),
    // Last 200 orders to derive connected client apps from metadata.businessName
    supabase.from('orders').select('metadata, created_at').order('created_at', { ascending: false }).limit(200),
  ]);

  const todayRevenue = (revenueToday ?? []).reduce((sum, o) => sum + Number(o.amount), 0);

  // Aggregate connected apps from metadata.businessName / appName
  const appMap = new Map<string, { totalOrders: number; lastActive: string | null }>();
  for (const order of recentOrdersMeta ?? []) {
    const meta = order.metadata as Record<string, unknown> | null;
    const name = (meta?.businessName ?? meta?.appName) as string | undefined;
    if (!name) continue;
    const existing = appMap.get(name);
    if (!existing) {
      appMap.set(name, { totalOrders: 1, lastActive: order.created_at as string });
    } else {
      existing.totalOrders += 1;
      if (!existing.lastActive || (order.created_at as string) > existing.lastActive) {
        existing.lastActive = order.created_at as string;
      }
    }
  }
  const connectedApps = Array.from(appMap.entries())
    .map(([name, data]) => ({
      name,
      webhookUrl: null as string | null,
      totalOrders: data.totalOrders,
      lastActive: data.lastActive,
      status: 'active' as const,
    }))
    .sort((a, b) => (b.lastActive ?? '').localeCompare(a.lastActive ?? ''));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'rgb(248 250 252)' }}>Dashboard</h1>
        <p style={{ color: 'rgb(100 116 139)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Today's Revenue"
          value={formatCurrency(todayRevenue)}
          sub={`${paidToday ?? 0} transactions`}
          color="emerald"
          icon="💰"
        />
        <MetricCard
          title="Total Orders"
          value={(totalOrders ?? 0).toString()}
          color="violet"
          icon="💳"
        />
        <MetricCard
          title="Pending Review"
          value={(pendingVerifications ?? 0).toString()}
          color="amber"
          icon="🔍"
          alert={(pendingVerifications ?? 0) > 0}
        />
        <MetricCard
          title="Fraud Flags"
          value={(fraudFlags ?? 0).toString()}
          color="red"
          icon="🛡️"
          alert={(fraudFlags ?? 0) > 0}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: 'rgb(248 250 252)' }}>Recent Orders</h2>
            <a href="/admin/orders" className="text-sm" style={{ color: 'rgb(139 92 246)' }}>View all →</a>
          </div>
          <OrdersTable orders={recentOrders ?? []} />
        </div>

        {/* Right column: Devices + Connected Apps */}
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-semibold mb-4" style={{ color: 'rgb(248 250 252)' }}>Android Devices</h2>
            <DeviceStatus devices={devices ?? []} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold" style={{ color: 'rgb(248 250 252)' }}>Connected Apps</h2>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{ background: 'rgb(139 92 246 / 0.12)', color: 'rgb(139 92 246)' }}
              >
                {connectedApps.length}
              </span>
            </div>
            <ConnectedAppsCard apps={connectedApps} />
          </div>
        </div>
      </div>
    </div>
  );
}
