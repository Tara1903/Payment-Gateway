import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { redirect } from 'next/navigation';
import { formatCurrency } from '@starpay/shared';
import { OrdersTable } from '@/components/admin/OrdersTable';
import { MetricCard } from '@/components/admin/MetricCard';
import { DeviceStatus } from '@/components/admin/DeviceStatus';

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
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PAID').gte('paid_at', today.toISOString()),
    supabase.from('orders').select('amount').eq('status', 'PAID').gte('paid_at', today.toISOString()),
    supabase.from('manual_verifications').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.from('fraud_flags').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('orders').select('id, order_ref, amount, reserved_amount, status, paid_at, created_at, customers(name, email)').order('created_at', { ascending: false }).limit(10),
    supabase.from('android_devices').select('id, device_name, last_heartbeat, battery_level, is_active, app_version').eq('is_active', true),
  ]);

  const todayRevenue = (revenueToday ?? []).reduce((sum, o) => sum + Number(o.amount), 0);

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

        {/* Device Status */}
        <div>
          <h2 className="font-semibold mb-4" style={{ color: 'rgb(248 250 252)' }}>Android Devices</h2>
          <DeviceStatus devices={devices ?? []} />
        </div>
      </div>
    </div>
  );
}
