import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { redirect } from 'next/navigation';
import { formatDateTime, formatCurrency } from '@starpay/shared';
import { resolveAppName } from '@/lib/utils/resolveApp';
import { listClientApps } from '@/lib/apps/manager';

export const metadata: Metadata = { title: 'Connected Apps & Bank Accounts' };
export const dynamic = 'force-dynamic';

function isRecentlyActive(lastActive: string | null): boolean {
  if (!lastActive) return false;
  return Date.now() - new Date(lastActive).getTime() < 14 * 24 * 60 * 60 * 1000; // 14 days
}

export default async function AppsPage() {
  const auth = await requireAdminRole('READ_ONLY');
  if (!auth.ok) redirect('/admin/login');

  const supabase = createAdminClient();

  // 1. Fetch registered apps with per-app bank configuration
  const registeredApps = await listClientApps();

  // 2. Fetch orders to aggregate real-time revenue and conversion per app
  const { data: orders } = await supabase
    .from('orders')
    .select('id, metadata, amount, status, created_at, webhook_url, return_url, description')
    .order('created_at', { ascending: false })
    .limit(1000);

  // Aggregate stats per app
  const appStatsMap = new Map<string, {
    totalOrders: number;
    paidOrders: number;
    totalRevenue: number;
    lastActive: string | null;
    webhookUrl: string | null;
    returnUrl: string | null;
  }>();

  for (const order of orders ?? []) {
    const m = order.metadata as Record<string, unknown> | null;
    const name = resolveAppName({
      businessName: m?.businessName as string,
      appName: m?.appName as string,
      metadata: m,
      webhookUrl: (order as unknown as { webhook_url?: string }).webhook_url,
      returnUrl: (order as unknown as { return_url?: string }).return_url,
      description: (order as unknown as { description?: string }).description,
    });

    const webhook = (order as unknown as { webhook_url?: string }).webhook_url || (m?.webhookUrl as string) || (m?.webhook_url as string) || null;
    const returnUrl = (order as unknown as { return_url?: string }).return_url || (m?.returnUrl as string) || (m?.return_url as string) || null;

    const existing = appStatsMap.get(name);
    if (!existing) {
      appStatsMap.set(name, {
        totalOrders: 1,
        paidOrders: order.status === 'PAID' ? 1 : 0,
        totalRevenue: order.status === 'PAID' ? Number(order.amount) : 0,
        lastActive: order.created_at as string,
        webhookUrl: webhook,
        returnUrl: returnUrl,
      });
    } else {
      existing.totalOrders += 1;
      if (order.status === 'PAID') {
        existing.paidOrders += 1;
        existing.totalRevenue += Number(order.amount);
      }
      if (webhook && !existing.webhookUrl) existing.webhookUrl = webhook;
      if (returnUrl && !existing.returnUrl) existing.returnUrl = returnUrl;
      if (!existing.lastActive || (order.created_at as string) > existing.lastActive) {
        existing.lastActive = order.created_at as string;
      }
    }
  }

  // Combine registered apps with dynamic stats
  const combinedApps = registeredApps.map((reg) => {
    const stats = appStatsMap.get(reg.name) || {
      totalOrders: 0,
      paidOrders: 0,
      totalRevenue: 0,
      lastActive: reg.createdAt,
      webhookUrl: reg.webhookUrl,
      returnUrl: reg.returnUrl,
    };
    return {
      ...reg,
      ...stats,
      webhookUrl: reg.webhookUrl || stats.webhookUrl,
      returnUrl: reg.returnUrl || stats.returnUrl,
    };
  });

  // Include any discovered apps that may not yet be registered in the manager
  for (const [name, stats] of appStatsMap.entries()) {
    if (!combinedApps.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
      combinedApps.push({
        id: `discovered-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        apiKey: 'sp_live_auto_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        upiId: '9630937033@sbi',
        accountHolderName: 'Hari Singh',
        bankName: 'State Bank of India',
        accountNumber: '2441',
        bankIfsc: 'SBIN0002441',
        usePlatformBank: true,
        isActive: true,
        createdAt: stats.lastActive || new Date().toISOString(),
        updatedAt: stats.lastActive || new Date().toISOString(),
        ...stats,
      });
    }
  }

  combinedApps.sort((a, b) => (b.lastActive ?? '').localeCompare(a.lastActive ?? ''));

  return (
    <div className="p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(248 250 252)' }}>Connected Apps & Bank Accounts</h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(100 116 139)' }}>
            Manage {combinedApps.length} connected client app{combinedApps.length !== 1 ? 's' : ''} with dedicated per-app settlement bank accounts and API keys.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/merchant"
            className="px-4 py-2.5 rounded-xl font-medium text-xs text-white transition flex items-center gap-2 shadow-sm"
            style={{ background: 'linear-gradient(135deg, rgb(139 92 246), rgb(109 40 217))' }}
          >
            <span>🏦</span>
            <span>Open Merchant & User Portal →</span>
          </Link>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
        {combinedApps.map((app) => {
          const active = isRecentlyActive(app.lastActive);
          const conversionRate = app.totalOrders > 0
            ? Math.round((app.paidOrders / app.totalOrders) * 100)
            : 0;

          return (
            <div
              key={app.name}
              className="rounded-2xl p-6 flex flex-col justify-between transition hover:border-slate-700"
              style={{ background: 'rgb(13 17 37)', border: '1px solid rgb(255 255 255 / 0.08)' }}
            >
              <div>
                {/* App header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: 'rgb(139 92 246 / 0.15)' }}
                    >
                      📱
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-100">{app.name}</p>
                      <p className="text-xs mt-0.5 text-slate-400">
                        {app.lastActive ? `Active ${formatDateTime(app.lastActive)}` : 'Standby'}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: active ? 'rgb(52 211 153 / 0.12)' : 'rgb(100 116 139 / 0.12)',
                      color: active ? 'rgb(52 211 153)' : 'rgb(100 116 139)',
                    }}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-0.5"
                      style={{ background: active ? 'rgb(52 211 153)' : 'rgb(100 116 139)' }}
                    />
                    {active ? 'Active' : 'Standby'}
                  </span>
                </div>

                {/* Per-App Settlement Bank Card */}
                <div
                  className="rounded-xl p-3.5 mb-4 text-xs"
                  style={{ background: 'rgb(255 255 255 / 0.02)', border: '1px solid rgb(255 255 255 / 0.06)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Settlement Bank</span>
                    <span className="font-mono text-violet-400 font-semibold">{app.upiId}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>{app.accountHolderName}</span>
                    <span className="font-mono text-slate-400">{app.bankName} ••••{app.accountNumber.slice(-4)}</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  <div className="rounded-xl p-3 text-center" style={{ background: 'rgb(255 255 255 / 0.03)' }}>
                    <p className="text-base font-bold font-mono text-slate-100">{app.totalOrders}</p>
                    <p className="text-[11px] mt-0.5 text-slate-400">Orders</p>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: 'rgb(255 255 255 / 0.03)' }}>
                    <p className="text-base font-bold font-mono text-emerald-400">{app.paidOrders}</p>
                    <p className="text-[11px] mt-0.5 text-slate-400">Paid</p>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: 'rgb(255 255 255 / 0.03)' }}>
                    <p className="text-base font-bold font-mono text-violet-400">{conversionRate}%</p>
                    <p className="text-[11px] mt-0.5 text-slate-400">Conv.</p>
                  </div>
                </div>

                {/* Revenue */}
                <div
                  className="rounded-xl p-3 flex items-center justify-between mb-4"
                  style={{ background: 'rgb(52 211 153 / 0.05)', border: '1px solid rgb(52 211 153 / 0.1)' }}
                >
                  <p className="text-xs text-slate-400">Total Volume</p>
                  <p className="font-bold font-mono text-sm text-emerald-400">
                    {formatCurrency(app.totalRevenue)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <Link
                  href={`/admin/orders?app=${encodeURIComponent(app.name)}`}
                  className="text-xs font-medium text-center py-2 px-3 rounded-lg flex-1 transition"
                  style={{ background: 'rgb(255 255 255 / 0.04)', color: 'rgb(203 213 225)' }}
                >
                  View Orders
                </Link>
                <Link
                  href="/merchant"
                  className="text-xs font-medium text-center py-2 px-3 rounded-lg flex-1 transition"
                  style={{ background: 'rgb(139 92 246 / 0.15)', color: 'rgb(167 139 250)' }}
                >
                  Configure Bank
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Setup Card */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'rgb(13 17 37)', border: '1px solid rgb(255 255 255 / 0.06)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
              style={{ background: 'rgb(139 92 246 / 0.15)', color: 'rgb(167 139 250)' }}
            >
              ⚡
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Multi-App Gateway Integration</h2>
              <p className="text-xs text-slate-400">
                Each app can either route to the platform primary account (<code className="text-violet-400">9630937033@sbi</code>) or specify its custom UPI VPA and settlement bank.
              </p>
            </div>
          </div>
          <Link
            href="/merchant"
            className="text-xs text-violet-400 hover:text-violet-300 font-semibold"
          >
            Launch Merchant Portal →
          </Link>
        </div>
      </div>
    </div>
  );
}
