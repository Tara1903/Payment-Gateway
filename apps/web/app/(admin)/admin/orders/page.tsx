import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { redirect } from 'next/navigation';
import { OrdersTable } from '@/components/admin/OrdersTable';

export const metadata: Metadata = { title: 'Orders' };
export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}

export default async function OrdersPage({ searchParams }: Props) {
  const auth = await requireAdminRole('READ_ONLY');
  if (!auth.ok) redirect('/admin/login');

  const { page: pageStr, status, search } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? '1', 10));
  const limit = 25;
  const from = (page - 1) * limit;

  const supabase = createAdminClient();
  let query = supabase
    .from('orders')
    .select('id, order_ref, amount, reserved_amount, status, paid_at, created_at, customers(name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (status) query = query.eq('status', status);

  const { data: orders, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / limit);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(248 250 252)' }}>Orders</h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(100 116 139)' }}>{count ?? 0} total orders</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[undefined, 'PAID', 'AWAITING_PAYMENT', 'PENDING_VERIFICATION', 'FAILED'].map((s) => (
          <a
            key={s ?? 'all'}
            href={s ? `/admin/orders?status=${s}` : '/admin/orders'}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{
              background: status === s ? 'rgb(139 92 246 / 0.15)' : 'rgb(255 255 255 / 0.04)',
              color: status === s ? 'rgb(167 139 250)' : 'rgb(100 116 139)',
              border: status === s ? '1px solid rgb(139 92 246 / 0.25)' : '1px solid rgb(255 255 255 / 0.08)',
            }}
          >
            {s ?? 'All'}
          </a>
        ))}
      </div>

      <OrdersTable orders={orders ?? []} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {page > 1 && (
            <a href={`/admin/orders?page=${page - 1}${status ? `&status=${status}` : ''}`}
              className="px-4 py-2 rounded-xl text-sm" style={{ background: 'rgb(255 255 255 / 0.04)', color: 'rgb(148 163 184)' }}>
              Previous
            </a>
          )}
          <span className="px-4 py-2 text-sm" style={{ color: 'rgb(100 116 139)' }}>Page {page} of {totalPages}</span>
          {page < totalPages && (
            <a href={`/admin/orders?page=${page + 1}${status ? `&status=${status}` : ''}`}
              className="px-4 py-2 rounded-xl text-sm" style={{ background: 'rgb(255 255 255 / 0.04)', color: 'rgb(148 163 184)' }}>
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}
