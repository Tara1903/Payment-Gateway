import { formatCurrency, formatDateTime } from '@starpay/shared';

type OrderStatus = 'CREATED' | 'AWAITING_PAYMENT' | 'VERIFYING' | 'PAID' | 'PENDING_VERIFICATION' | 'FAILED' | 'REFUNDED';

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  CREATED: { bg: 'rgb(96 165 250 / 0.1)', text: 'rgb(96 165 250)', label: 'Created' },
  AWAITING_PAYMENT: { bg: 'rgb(251 191 36 / 0.1)', text: 'rgb(251 191 36)', label: 'Awaiting' },
  VERIFYING: { bg: 'rgb(139 92 246 / 0.1)', text: 'rgb(139 92 246)', label: 'Verifying' },
  PAID: { bg: 'rgb(52 211 153 / 0.1)', text: 'rgb(52 211 153)', label: 'Paid' },
  PENDING_VERIFICATION: { bg: 'rgb(251 191 36 / 0.1)', text: 'rgb(251 191 36)', label: 'Pending' },
  FAILED: { bg: 'rgb(248 113 113 / 0.1)', text: 'rgb(248 113 113)', label: 'Failed' },
  REFUNDED: { bg: 'rgb(100 116 139 / 0.1)', text: 'rgb(100 116 139)', label: 'Refunded' },
};

type CustomerLike = { name: string | null; email: string | null };

interface Order {
  id: string;
  order_ref: string;
  amount: number | string;
  reserved_amount: number | string;
  status: OrderStatus;
  paid_at: string | null;
  created_at: string;
  // Supabase join returns array for customers even on many-to-one; accept both
  customers: CustomerLike | CustomerLike[] | null;
}

function resolveCustomer(customers: Order['customers']): CustomerLike | null {
  if (!customers) return null;
  if (Array.isArray(customers)) return customers[0] ?? null;
  return customers;
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: 'rgb(13 17 37)', border: '1px solid rgb(255 255 255 / 0.06)' }}>
        <p style={{ color: 'rgb(100 116 139)' }}>No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgb(13 17 37)', border: '1px solid rgb(255 255 255 / 0.06)' }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgb(255 255 255 / 0.06)' }}>
              {['Order', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'rgb(71 85 105)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => {
              const style = STATUS_STYLES[order.status];
              const customer = resolveCustomer(order.customers);
              return (
                <tr
                  key={order.id}
                  style={{ borderBottom: idx < orders.length - 1 ? '1px solid rgb(255 255 255 / 0.04)' : 'none' }}
                >
                  <td className="px-4 py-3">
                    <a href={`/admin/orders/${order.id}`} className="font-mono text-sm hover:underline" style={{ color: 'rgb(167 139 250)' }}>
                      {order.order_ref}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm" style={{ color: 'rgb(248 250 252)' }}>{customer?.name ?? 'Guest'}</p>
                    <p className="text-xs" style={{ color: 'rgb(71 85 105)' }}>{customer?.email ?? ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-sm font-medium" style={{ color: 'rgb(248 250 252)' }}>{formatCurrency(Number(order.amount))}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ background: style.bg, color: style.text }}
                    >
                      {style.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs" style={{ color: 'rgb(100 116 139)' }}>{formatDateTime(order.created_at)}</p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
