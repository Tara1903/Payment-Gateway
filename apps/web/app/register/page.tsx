'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');

  // Settlement Bank Details (pre-filled with platform defaults)
  const [showBankOptions, setShowBankOptions] = useState(false);
  const [upiId, setUpiId] = useState('9630937033@sbi');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('State Bank of India');
  const [accountNumber, setAccountNumber] = useState('2441');
  const [bankIfsc, setBankIfsc] = useState('SBIN0002441');

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Call Backend Registration Endpoint
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          businessName,
          upiId: upiId.trim() || '9630937033@sbi',
          accountHolderName: accountHolderName.trim() || fullName,
          bankName: bankName.trim() || 'State Bank of India',
          accountNumber: accountNumber.trim() || '2441',
          bankIfsc: bankIfsc.trim().toUpperCase() || 'SBIN0002441',
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message || 'Registration failed');
        setLoading(false);
        return;
      }

      setSuccess('Account and merchant app created! Signing you in...');

      // 2. Automatically log in the user
      const supabase = createClient();
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginErr) {
        // Fallback: prompt user to log in manually if cookie issue
        router.push('/admin/login');
        return;
      }

      // 3. Redirect to Merchant Portal
      router.push('/merchant');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-3.5 sm:p-4 py-8 sm:py-12"
      style={{ background: 'rgb(2 6 23)' }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgb(139 92 246 / 0.18), transparent)',
        }}
      />

      <div className="card p-5 sm:p-8 w-full max-w-lg relative z-10 border border-slate-800 shadow-2xl rounded-2xl bg-slate-900/90">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center gradient-brand mb-4 glow-brand shadow-lg">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create Merchant Account
          </h1>
          <p className="text-sm mt-1 text-slate-400 text-center">
            Register your business, receive dedicated API keys, and start accepting instant UPI payments.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl p-3.5 text-sm bg-red-500/10 text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl p-3.5 text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (!accountHolderName) setAccountHolderName(e.target.value);
                }}
                placeholder="Hari Singh"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all bg-slate-950 border border-slate-800 text-white focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Business / App Name *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Sardar Ji Food Corner"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all bg-slate-950 border border-slate-800 text-white focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="merchant@example.com"
              autoComplete="email"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all bg-slate-950 border border-slate-800 text-white focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              autoComplete="new-password"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all bg-slate-950 border border-slate-800 text-white focus:border-violet-500"
            />
          </div>

          {/* Settlement Bank Details Accordion */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowBankOptions(!showBankOptions)}
              className="flex items-center justify-between w-full text-xs font-semibold text-violet-400 hover:text-violet-300 py-1"
            >
              <span>⚙️ {showBankOptions ? 'Hide Bank Account Setup' : 'Custom Settlement Bank Details (Optional)'}</span>
              <span>{showBankOptions ? '▲' : '▼'}</span>
            </button>

            {showBankOptions ? (
              <div className="mt-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <p className="text-xs text-slate-400">
                  Configure where your incoming UPI payments are settled. Defaults to platform SBI account.
                </p>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Settlement UPI ID (VPA)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="9630937033@sbi"
                    className="w-full rounded-lg px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 text-white focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="State Bank of India"
                      className="w-full rounded-lg px-3 py-2 text-xs bg-slate-900 border border-slate-800 text-white focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="2441"
                      className="w-full rounded-lg px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 text-white focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Bank IFSC Code</label>
                  <input
                    type="text"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="SBIN0002441"
                    className="w-full rounded-lg px-3 py-2 text-xs font-mono uppercase bg-slate-900 border border-slate-800 text-white focus:border-violet-500"
                  />
                </div>
              </div>
            ) : (
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Default settlement: <span className="font-mono text-slate-400">{upiId}</span></span>
                <span>(Click above to customize)</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 mt-3 shadow-md"
            style={{ background: 'rgb(139 92 246)', color: 'white' }}
          >
            {loading ? 'Creating Account & App…' : 'Create Merchant Account →'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link
              href="/admin/login"
              className="text-violet-400 hover:text-violet-300 font-semibold transition"
            >
              Sign In here
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-4 text-slate-600">
          Instant activation • Dedicated Live API key provided automatically
        </p>
      </div>
    </div>
  );
}
