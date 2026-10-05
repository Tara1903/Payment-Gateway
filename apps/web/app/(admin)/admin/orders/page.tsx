import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { redirect } from 'next/navigation';
import { OrdersTable } from '@/components/admin/OrdersTable';
import { resolveAppName } from '@/lib/utils/resolveApp';

export const metadata: Metadata = { title: 'Orders' };
export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ page?: string; status?: string; app?: string }>;
}

export default async function OrdersPage({ searchParams }: Props) {
  const auth = await requireAdminRole('READ_ONLY');
  if (!auth.ok) redirect('/admin/login');

  const { page: pageStr, status, app } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? '1', 10));
  const limit = 25;
  const from = (page - 1) * limit;

  const supabase = createAdminClient();

  // Fetch sample of orders to build the app filter list
  const { data: allMeta } = await supabase
    .from('orders')
    .select('metadata, webhook_url, return_url, description')
    .order('created_at', { ascending: false })
    .limit(500);

  const discoveredApps = (allMeta ?? []).map((o) =>
    resolveAppName({
      businessName: (o.metadata as any)?.businessName,
      appName: (o.metadata as any)?.appName,
      metadata: o.metadata as any,
      webhookUrl: (o as any).webhook_url,
      returnUrl: (o as any).return_url,
      description: (o as any).description,
    })
  );

  const appSet = new Set(discoveredApps);
  appSet.add('Sardar Ji Food Corner');
  const appNames = Array.from(appSet).sort();

  let query = supabase
    .from('orders')
    .select('id, order_ref, amount, reserved_amount, status, paid_at, created_at, metadata, webhook_url, return_url, description, customers(name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (status) query = query.eq('status', status);

  const { data: orders, count } = await query;

  // Filter orders by resolved app name
  const filteredOrders = app
    ? (orders ?? []).filter((o) => {
        const resolved = resolveAppName({
          businessName: (o.metadata as any)?.businessName,
          appName: (o.metadata as any)?.appName,
          metadata: o.metadata as any,
          webhookUrl: (o as any).webhook_url,
          returnUrl: (o as any).return_url,
          description: (o as any).description,
        });
        return resolved === app;
      })
    : (orders ?? []);

  const totalPages = Math.ceil((count ?? 0) / limit);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    if (overrides.page ?? (page > 1 ? String(page) : undefined)) params.set('page', overrides.page ?? String(page));
    if (overrides.status !== undefined ? overrides.status : status) params.set('status', (overrides.status !== undefined ? overrides.status : status)!);
    if (overrides.app !== undefined ? overrides.app : app) params.set('app', (overrides.app !== undefined ? overrides.app : app)!);
    const qs = params.toString();
    return `/admin/orders${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'rgb(248 250 252)' }}>Orders</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'rgb(100 116 139)' }}>{count ?? 0} total orders</p>
        </div>
      </div>

      {/* App Filter */}
      {appNames.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium mb-2" style={{ color: 'rgb(71 85 105)' }}>Filter by Connected App</p>
          <div className="flex gap-2 flex-wrap">
            <a
              href={buildUrl({ app: undefined, page: '1' })}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: !app ? 'rgb(139 92 246 / 0.15)' : 'rgb(255 255 255 / 0.04)',
                color: !app ? 'rgb(167 139 250)' : 'rgb(100 116 139)',
                border: !app ? '1px solid rgb(139 92 246 / 0.25)' : '1px solid rgb(255 255 255 / 0.08)',
              }}
            >
              All Apps
            </a>
            {appNames.map((name) => (
              <a
                key={name}
                href={buildUrl({ app: name, page: '1' })}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: app === name ? 'rgb(139 92 246 / 0.15)' : 'rgb(255 255 255 / 0.04)',
                  color: app === name ? 'rgb(167 139 250)' : 'rgb(100 116 139)',
                  border: app === name ? '1px solid rgb(139 92 246 / 0.25)' : '1px solid rgb(255 255 255 / 0.08)',
                }}
              >
                {name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[undefined, 'PAID', 'AWAITING_PAYMENT', 'PENDING_VERIFICATION', 'FAILED'].map((s) => (
          <a
            key={s ?? 'all'}
            href={buildUrl({ status: s, page: '1' })}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{
              background: status === s ? 'rgb(139 92 246 / 0.15)' : 'rgb(255 255 255 / 0.04)',
              color: status === s ? 'rgb(167 139 250)' : 'rgb(100 116 139)',
              border: status === s ? '1px solid rgb(139 92 246 / 0.25)' : '1px solid rgb(255 255 255 / 0.08)',
            }}
          >
            {s ?? 'All Statuses'}
          </a>
        ))}
      </div>

      <OrdersTable orders={filteredOrders} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {page > 1 && (
            <a
              href={buildUrl({ page: String(page - 1) })}
              className="px-4 py-2 rounded-xl text-sm"
              style={{ background: 'rgb(255 255 255 / 0.04)', color: 'rgb(148 163 184)' }}
            >
              Previous
            </a>
          )}
          <span className="px-4 py-2 text-sm" style={{ color: 'rgb(100 116 139)' }}>Page {page} of {totalPages}</span>
          {page < totalPages && (
            <a
              href={buildUrl({ page: String(page + 1) })}
              className="px-4 py-2 rounded-xl text-sm"
              style={{ background: 'rgb(255 255 255 / 0.04)', color: 'rgb(148 163 184)' }}
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}
