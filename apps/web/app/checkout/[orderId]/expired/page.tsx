import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Order Expired | StarPay' };

export default function ExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'rgb(2 6 23)' }}>
      <div className="card p-10 max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ background: 'rgb(248 113 113 / 0.1)' }}>
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="rgb(248 113 113)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(248 250 252)' }}>Order Expired</h1>
        <p style={{ color: 'rgb(148 163 184)' }}>
          This payment link has expired. Please contact us or start a new order.
        </p>
      </div>
    </div>
  );
}
