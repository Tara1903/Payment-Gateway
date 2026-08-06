'use client';

import { useState } from 'react';

interface Props {
  orderId: string;
  token: string;
  onSuccess: () => void;
}

export function ManualVerificationForm({ orderId, token, onSuccess }: Props) {
  const [utr, setUtr] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (utr.length > 0 && !/^\d{12}$/.test(utr)) {
      setError('UTR must be exactly 12 digits');
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch('/api/manual-verifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Payment-Token': token },
      body: JSON.stringify({
        orderId,
        utrEntered: utr || undefined,
        notes: notes || undefined,
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (json.success) {
      setSubmitted(true);
      onSuccess();
    } else {
      setError(json.error?.message ?? 'Submission failed. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-lg font-bold mb-2" style={{ color: 'rgb(248 250 252)' }}>Details Submitted</h3>
        <p className="text-sm" style={{ color: 'rgb(148 163 184)' }}>
          Our team will verify your payment and update the status shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold mb-1" style={{ color: 'rgb(248 250 252)' }}>Submit Payment Details</h3>
      <p className="text-sm mb-5" style={{ color: 'rgb(148 163 184)' }}>
        If you completed the payment, enter your UTR number from the payment receipt.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(148 163 184)' }}>
            UTR Number (12 digits)
          </label>
          <input
            type="text"
            value={utr}
            onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
            placeholder="e.g. 123456789012"
            maxLength={12}
            className="w-full rounded-xl px-4 py-3 font-mono text-sm outline-none transition-all"
            style={{
              background: 'rgb(255 255 255 / 0.04)',
              border: '1px solid rgb(255 255 255 / 0.1)',
              color: 'rgb(248 250 252)',
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgb(139 92 246 / 0.6)'}
            onBlur={(e) => e.target.style.borderColor = 'rgb(255 255 255 / 0.1)'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(148 163 184)' }}>
            Additional Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional information..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-all"
            style={{
              background: 'rgb(255 255 255 / 0.04)',
              border: '1px solid rgb(255 255 255 / 0.1)',
              color: 'rgb(248 250 252)',
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgb(139 92 246 / 0.6)'}
            onBlur={(e) => e.target.style.borderColor = 'rgb(255 255 255 / 0.1)'}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'rgb(248 113 113)' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || (!utr)}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          style={{ background: 'rgb(139 92 246)', color: 'white' }}
        >
          {loading ? 'Submitting…' : 'Submit for Review'}
        </button>
      </form>
    </div>
  );
}
