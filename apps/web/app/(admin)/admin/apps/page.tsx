import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { redirect } from 'next/navigation';
import { formatDateTime, formatCurrency } from '@starpay/shared';
import { resolveAppName } from '@/lib/utils/resolveApp';

export const metadata: Metadata = { title: 'Connected Apps' };
export const dynamic = 'force-dynamic';

function isRecentlyActive(lastActive: string | null): boolean {
  if (!lastActive) return false;
  return Date.now() - new Date(lastActive).getTime() < 14 * 24 * 60 * 60 * 1000; // 14 days
}

export default async function AppsPage() {
  const auth = await requireAdminRole('READ_ONLY');
  if (!auth.ok) redirect('/admin/login');

  const supabase = createAdminClient();

  // Fetch orders with all details to reliably group by client app
  const { data: orders } = await supabase
    .from('orders')
    .select('id, metadata, amount, status, created_at, webhook_url, return_url, description')
    .order('created_at', { ascending: false })
    .limit(1000);

  // Aggregate per app
  const appMap = new Map<string, {
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
      webhookUrl: (order as any).webhook_url,
      returnUrl: (order as any).return_url,
      description: (order as any).description,
    });

    const webhook = (order as any).webhook_url || (m?.webhookUrl as string) || (m?.webhook_url as string) || null;
    const returnUrl = (order as any).return_url || (m?.returnUrl as string) || (m?.return_url as string) || null;

    const existing = appMap.get(name);
    if (!existing) {
      appMap.set(name, {
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

  // Ensure active registered apps like Sardar Ji are always listed
  if (!appMap.has('Sardar Ji Food Corner')) {
    appMap.set('Sardar Ji Food Corner', {
      totalOrders: 0,
      paidOrders: 0,
      totalRevenue: 0,
      lastActive: new Date().toISOString(),
      webhookUrl: 'https://sardar-ji.vercel.app/api/starpay/webhook',
      returnUrl: 'https://sardar-ji.vercel.app/order-success',
    });
  }

  const apps = Array.from(appMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => (b.lastActive ?? '').localeCompare(a.lastActive ?? ''));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(248 250 252)' }}>Connected Apps</h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(100 116 139)' }}>
            {apps.length} app{apps.length !== 1 ? 's' : ''} connected and routing payments to your primary bank account
          </p>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
        {apps.map((app) => {
          const active = isRecentlyActive(app.lastActive);
          const conversionRate = app.totalOrders > 0
            ? Math.round((app.paidOrders / app.totalOrders) * 100)
            : 0;

          return (
            <div
              key={app.name}
              className="rounded-2xl p-5 flex flex-col justify-between"
              style={{ background: 'rgb(13 17 37)', border: '1px solid rgb(255 255 255 / 0.06)' }}
            >
              <div>
                {/* App header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: 'rgb(139 92 246 / 0.12)' }}
                    >
                      📱
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'rgb(248 250 252)' }}>{app.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgb(71 85 105)' }}>
                        {app.lastActive ? `Active ${formatDateTime(app.lastActive)}` : 'Standby'}
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
                    {active ? 'Active' : 'Standby'}
                  </span>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
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
                  className="rounded-xl p-3 flex items-center justify-between mb-4"
                  style={{ background: 'rgb(52 211 153 / 0.05)', border: '1px solid rgb(52 211 153 / 0.1)' }}
                >
                  <p className="text-xs" style={{ color: 'rgb(100 116 139)' }}>Total Revenue</p>
                  <p className="font-bold font-mono text-sm" style={{ color: 'rgb(52 211 153)' }}>
                    {formatCurrency(app.totalRevenue)}
                  </p>
                </div>

                {/* Webhook URL display */}
                {app.webhookUrl && (
                  <div className="mb-4">
                    <p className="text-xs mb-1" style={{ color: 'rgb(71 85 105)' }}>Webhook Target</p>
                    <p className="text-xs font-mono truncate" style={{ color: 'rgb(139 92 246)' }} title={app.webhookUrl}>
                      {app.webhookUrl}
                    </p>
                  </div>
                )}
              </div>

              {/* View orders button */}
              <a
                href={`/admin/orders?app=${encodeURIComponent(app.name)}`}
                className="text-xs font-medium text-center py-2.5 rounded-xl transition-all block mt-2"
                style={{ background: 'rgb(139 92 246 / 0.1)', color: 'rgb(167 139 250)' }}
              >
                View App Orders →
              </a>
            </div>
          );
        })}
      </div>

      {/* Integration Guide: How to connect any app */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'rgb(13 17 37)', border: '1px solid rgb(255 255 255 / 0.06)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgb(139 92 246 / 0.15)', color: 'rgb(167 139 250)' }}
          >
            ⚡
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'rgb(248 250 252)' }}>
              How to Connect Any New App
            </h2>
            <p className="text-xs" style={{ color: 'rgb(100 116 139)' }}>
              Any client app (website, Android app, or POS) is automatically detected and listed here as soon as it sends an order.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-4">
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgb(255 255 255 / 0.02)', border: '1px solid rgb(255 255 255 / 0.04)' }}
          >
            <p className="font-semibold mb-2" style={{ color: 'rgb(248 250 252)' }}>1. Create Order with App Name</p>
            <p className="mb-2" style={{ color: 'rgb(148 163 184)' }}>
              When your client app calls <code className="text-violet-400">POST /api/orders</code>, include your app name in the payload:
            </p>
            <pre
              className="p-3 rounded-lg overflow-x-auto font-mono text-[11px]"
              style={{ background: 'rgb(2 6 23)', color: 'rgb(167 139 250)' }}
            >
{`fetch('https://payment-gateway-web-kappa.vercel.app/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_INTERNAL_API_KEY'
  },
  body: JSON.stringify({
    amount: 250.00,
    businessName: 'My Awesome App', // <-- Your App Name
    customerName: 'Customer Name',
    webhookUrl: 'https://myapp.com/api/payment-webhook'
  })
})`}
            </pre>
          </div>

          <div
            className="rounded-xl p-4"
            style={{ background: 'rgb(255 255 255 / 0.02)', border: '1px solid rgb(255 255 255 / 0.04)' }}
          >
            <p className="font-semibold mb-2" style={{ color: 'rgb(248 250 252)' }}>2. Instant Discovery</p>
            <ul className="flex flex-col gap-2" style={{ color: 'rgb(148 163 184)' }}>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                <span><strong>No manual configuration:</strong> The gateway automatically provisions the app profile on first contact.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                <span><strong>Unified Settlement:</strong> All customer payments route straight to your primary merchant UPI ID (<code className="text-slate-300">ayurdhara@upi</code>).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                <span><strong>Real-time Tracking:</strong> Orders, volume, and webhook notifications are tracked separately per client app.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
