import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Payment Successful | StarPay' };

interface Props {
  searchParams: Promise<{ ref?: string; amount?: string }>;
}

export default async function SuccessPage({ searchParams }: Props) {
  const { ref, amount } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'rgb(2 6 23)' }}>
      <div className="card p-10 max-w-md w-full text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 glow-success" style={{ background: 'rgb(52 211 153 / 0.15)' }}>
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="rgb(52 211 153)" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(248 250 252)' }}>Payment Successful!</h1>
        <p style={{ color: 'rgb(148 163 184)' }} className="mb-6">
          Your payment has been verified and confirmed.
        </p>
        {ref && (
          <div className="rounded-xl p-4 mb-6" style={{ background: 'rgb(255 255 255 / 0.04)', border: '1px solid rgb(255 255 255 / 0.08)' }}>
            <p className="text-xs mb-1" style={{ color: 'rgb(148 163 184)' }}>Order Reference</p>
            <p className="font-mono font-semibold" style={{ color: 'rgb(248 250 252)' }}>{ref}</p>
            {amount && <p className="text-sm mt-1" style={{ color: 'rgb(52 211 153)' }}>₹{amount}</p>}
          </div>
        )}
        <p className="text-sm" style={{ color: 'rgb(71 85 105)' }}>A confirmation email has been sent if you provided your email address.</p>
      </div>
    </div>
  );
}
