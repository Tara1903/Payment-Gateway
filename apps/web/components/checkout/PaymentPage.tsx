'use client';

import { useState, useEffect, useCallback } from 'react';
import { QRDisplay } from './QRDisplay';
import { Timer } from './Timer';
import { ManualVerificationForm } from './ManualVerificationForm';
import { useRouter } from 'next/navigation';

type OrderStatus = 'CREATED' | 'AWAITING_PAYMENT' | 'VERIFYING' | 'PAID' | 'PENDING_VERIFICATION' | 'FAILED' | 'REFUNDED';

interface OrderData {
  orderId: string;
  orderRef: string;
  amount: number;
  reservedAmount: number;
  currency: string;
  description: string | null;
  status: OrderStatus;
  upiTxnRef: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  returnUrl?: string | null;
}

interface QRData {
  qrDataUrl: string;
  upiUrl: string;
  upiId: string;
  amount: number;
  expiresAt: string | null;
}

interface Props {
  orderId: string;
  token: string;
}

export function PaymentPage({ orderId, token }: Props) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false);

  const fetchOrder = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}?token=${token}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data as OrderData : null;
  }, [orderId, token]);

  const fetchQR = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}/qr?token=${token}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data as QRData : null;
  }, [orderId, token]);

  useEffect(() => {
    async function init() {
      const [orderData, qr] = await Promise.all([fetchOrder(), fetchQR()]);
      setOrder(orderData);
      setQrData(qr);
      setLoading(false);
    }
    init();
  }, [fetchOrder, fetchQR]);

  // Poll for status every 3 seconds
  useEffect(() => {
    if (!order || order.status === 'PAID' || order.status === 'FAILED') return;

    const interval = setInterval(async () => {
      const updated = await fetchOrder();
      if (updated) {
        setOrder(updated);
        if (updated.status === 'PAID') {
          clearInterval(interval);
          if (updated.returnUrl) {
            const url = new URL(updated.returnUrl);
            url.searchParams.set('orderId', orderId);
            url.searchParams.set('status', 'PAID');
            window.location.href = url.toString();
          } else {
            router.push(`/checkout/${orderId}/success?ref=${updated.orderRef}&amount=${updated.amount.toFixed(2)}`);
          }
        } else if (updated.status === 'FAILED') {
          clearInterval(interval);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [order, fetchOrder, orderId, router]);

  // Auto-show fallback after 10 minutes
  useEffect(() => {
    const timer = setTimeout(() => setShowFallback(true), 10 * 60 * 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(2 6 23)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p style={{ color: 'rgb(148 163 184)' }}>Loading payment details…</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(2 6 23)' }}>
        <div className="card p-8 text-center">
          <p style={{ color: 'rgb(248 113 113)' }}>Order not found or token expired.</p>
        </div>
      </div>
    );
  }

  if (order.status === 'PAID') {
    if (order.returnUrl) {
      // Append order ID and status to return URL
      const url = new URL(order.returnUrl);
      url.searchParams.set('orderId', orderId);
      url.searchParams.set('status', 'PAID');
      window.location.href = url.toString();
    } else {
      router.push(`/checkout/${orderId}/success?ref=${order.orderRef}&amount=${order.amount.toFixed(2)}`);
    }
    return null;
  }

  if (order.status === 'FAILED' && !order.paidAt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'rgb(2 6 23)' }}>
        <div className="card p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'rgb(248 250 252)' }}>Order Expired</h2>
          <p style={{ color: 'rgb(148 163 184)' }}>This payment link has expired. Please contact us if you completed a payment.</p>
        </div>
      </div>
    );
  }

  const isVerifying = order.status === 'VERIFYING';
  const isPendingVerification = order.status === 'PENDING_VERIFICATION';

  return (
    <div className="min-h-screen" style={{ background: 'rgb(2 6 23)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'rgb(255 255 255 / 0.06)' }}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center gradient-brand">
            <span className="text-sm">⚡</span>
          </div>
          <span className="font-semibold" style={{ color: 'rgb(248 250 252)' }}>Ayurdhara</span>
          <div className="ml-auto">
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgb(52 211 153 / 0.1)', color: 'rgb(52 211 153)' }}>
              Secured by StarPay
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Amount Display */}
        <div className="text-center mb-8">
          <p className="text-sm mb-1" style={{ color: 'rgb(148 163 184)' }}>Amount to Pay</p>
          <p className="text-5xl font-bold" style={{ color: 'rgb(248 250 252)' }}>
            ₹<span className="font-mono">{order.reservedAmount.toFixed(2)}</span>
          </p>
          {order.description && (
            <p className="text-sm mt-2" style={{ color: 'rgb(148 163 184)' }}>{order.description}</p>
          )}
          <p className="text-xs mt-1 font-mono" style={{ color: 'rgb(71 85 105)' }}>Ref: {order.orderRef}</p>
        </div>

        {isVerifying && (
          <div className="card p-6 mb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
              <p className="font-semibold" style={{ color: 'rgb(248 250 252)' }}>Verifying your payment…</p>
            </div>
            <p className="text-sm" style={{ color: 'rgb(148 163 184)' }}>This usually takes a few seconds.</p>
          </div>
        )}

        {isPendingVerification && !showFallback && (
          <div className="card p-6 mb-6 text-center border" style={{ borderColor: 'rgb(251 191 36 / 0.3)', background: 'rgb(251 191 36 / 0.05)' }}>
            <p className="font-semibold mb-1" style={{ color: 'rgb(251 191 36)' }}>Manual Review Required</p>
            <p className="text-sm" style={{ color: 'rgb(148 163 184)' }}>Your payment is being reviewed by our team.</p>
            <button
              onClick={() => setShowFallback(true)}
              className="mt-3 text-sm underline"
              style={{ color: 'rgb(139 92 246)' }}
            >
              Submit payment details manually
            </button>
          </div>
        )}

        {/* QR + Timer (only when awaiting payment) */}
        {(order.status === 'AWAITING_PAYMENT' || order.status === 'CREATED') && !showFallback && (
          <>
            {qrData ? (
              <QRDisplay
                qrDataUrl={qrData.qrDataUrl}
                upiUrl={qrData.upiUrl}
                upiId={qrData.upiId}
                amount={order.reservedAmount}
              />
            ) : (
              <div className="card p-8 text-center mb-4">
                <div className="w-48 h-48 skeleton mx-auto mb-4 rounded-xl" />
                <p style={{ color: 'rgb(148 163 184)', fontSize: '0.875rem' }}>Generating QR code…</p>
              </div>
            )}

            {order.expiresAt && (
              <Timer
                expiresAt={order.expiresAt}
                onExpired={() => setShowFallback(true)}
              />
            )}

            <button
              onClick={() => setShowFallback(true)}
              className="w-full mt-4 text-sm py-3"
              style={{ color: 'rgb(148 163 184)' }}
            >
              Already paid? Submit details manually →
            </button>
          </>
        )}

        {/* Manual Verification Fallback */}
        {showFallback && (
          <ManualVerificationForm
            orderId={orderId}
            token={token}
            onSuccess={() => setOrder((prev) => prev ? { ...prev, status: 'PENDING_VERIFICATION' } : prev)}
          />
        )}
      </main>
    </div>
  );
}
