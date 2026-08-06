import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { notFound, redirect } from 'next/navigation';
import { formatCurrency, formatDateTime } from '@starpay/shared';
import { VerificationTimeline } from '@/components/timeline/VerificationTimeline';

export const metadata: Metadata = { title: 'Order Detail' };
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ orderId: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  PAID: 'rgb(52 211 153)',
  AWAITING_PAYMENT: 'rgb(251 191 36)',
  VERIFYING: 'rgb(139 92 246)',
  PENDING_VERIFICATION: 'rgb(251 191 36)',
  FAILED: 'rgb(248 113 113)',
  CREATED: 'rgb(96 165 250)',
  REFUNDED: 'rgb(100 116 139)',
};

export default async function OrderDetailPage({ params }: Props) {
  const auth = await requireAdminRole('READ_ONLY');
  if (!auth.ok) redirect('/admin/login');

  const { orderId } = await params;
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from('orders')
    .select(`*, customers(id, name, email, phone), transactions(id, utr, amount, source, status, created_at), invoices(id, invoice_number, pdf_url)`)
    .eq('id', orderId)
    .single();

  if (!order) notFound();

  const statusColor = STATUS_COLORS[order.status] ?? 'rgb(100 116 139)';

  return (
    <div className="p-8">
      {/* Back link */}
      <a href="/admin/orders" className="text-sm mb-6 inline-flex items-center gap-1" style={{ color: 'rgb(100 116 139)' }}>
        ← Orders
      </a>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-mono" style={{ color: 'rgb(248 250 252)' }}>{order.order_ref}</h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(100 116 139)' }}>Created {formatDateTime(order.created_at)}</p>
        </div>
        <span
          className="px-3 py-1.5 rounded-xl text-sm font-semibold"
          style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}
        >
          {order.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Payment Details */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4" style={{ color: 'rgb(248 250 252)' }}>Payment Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              {[
                { label: 'Amount', value: formatCurrency(order.amount) },
                { label: 'Reserved Amount', value: `₹${Number(order.reserved_amount).toFixed(2)}` },
                { label: 'Currency', value: order.currency },
                { label: 'UPI Ref', value: order.upi_txn_ref ?? '—' },
                { label: 'Paid At', value: order.paid_at ? formatDateTime(order.paid_at) : '—' },
                { label: 'Expires At', value: order.expires_at ? formatDateTime(order.expires_at) : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs mb-1" style={{ color: 'rgb(71 85 105)' }}>{label}</dt>
                  <dd className="text-sm font-medium font-mono" style={{ color: 'rgb(248 250 252)' }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Transactions */}
          {Array.isArray(order.transactions) && order.transactions.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold mb-4" style={{ color: 'rgb(248 250 252)' }}>Transactions</h2>
              <div className="flex flex-col gap-3">
                {(order.transactions as Array<{ id: string; utr: string | null; amount: number; source: string; status: string; created_at: string }>).map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgb(255 255 255 / 0.03)' }}>
                    <div>
                      <p className="text-sm font-mono" style={{ color: 'rgb(248 250 252)' }}>UTR: {txn.utr ?? '—'}</p>
                      <p className="text-xs" style={{ color: 'rgb(71 85 105)' }}>{txn.source} • {formatDateTime(txn.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono" style={{ color: 'rgb(248 250 252)' }}>₹{Number(txn.amount).toFixed(2)}</p>
                      <p className="text-xs" style={{ color: txn.status === 'VERIFIED' ? 'rgb(52 211 153)' : 'rgb(100 116 139)' }}>{txn.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Customer */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4" style={{ color: 'rgb(248 250 252)' }}>Customer</h2>
            {order.customers ? (
              <dl className="flex flex-col gap-3">
                <div>
                  <dt className="text-xs mb-0.5" style={{ color: 'rgb(71 85 105)' }}>Name</dt>
                  <dd className="text-sm" style={{ color: 'rgb(248 250 252)' }}>{(order.customers as {name: string|null}).name ?? 'Guest'}</dd>
                </div>
                <div>
                  <dt className="text-xs mb-0.5" style={{ color: 'rgb(71 85 105)' }}>Email</dt>
                  <dd className="text-sm" style={{ color: 'rgb(248 250 252)' }}>{(order.customers as {email: string|null}).email ?? '—'}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm" style={{ color: 'rgb(100 116 139)' }}>Guest checkout</p>
            )}
          </div>

          {/* Timeline */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4" style={{ color: 'rgb(248 250 252)' }}>Verification Timeline</h2>
            <VerificationTimeline orderId={orderId} />
          </div>
        </div>
      </div>
    </div>
  );
}
