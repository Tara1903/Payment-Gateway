'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/merchant';

  const [mode, setMode] = useState<'signin' | 'register'>('signin');

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showBankOptions, setShowBankOptions] = useState(false);
  const [upiId, setUpiId] = useState('9630937033@sbi');
  const [bankName, setBankName] = useState('State Bank of India');
  const [accountNumber, setAccountNumber] = useState('2441');
  const [bankIfsc, setBankIfsc] = useState('SBIN0002441');

  // Common UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });

    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          businessName,
          upiId: upiId.trim() || '9630937033@sbi',
          accountHolderName: fullName,
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

      setSuccess('Merchant account & app created! Signing you in…');

      // Auto login with credentials
      const supabase = createClient();
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginErr) {
        setMode('signin');
        setLoading(false);
        return;
      }

      router.push('/merchant');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration error');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 py-12"
      style={{ background: 'rgb(2 6 23)' }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgb(139 92 246 / 0.16), transparent)',
        }}
      />

      <div
        className={`card p-8 w-full ${
          mode === 'register' ? 'max-w-lg' : 'max-w-sm'
        } relative z-10 transition-all duration-200 border border-slate-800 shadow-2xl rounded-2xl bg-slate-900/90`}
      >
        {/* Logo & Heading */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center gradient-brand mb-3 glow-brand shadow-lg">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            {mode === 'signin' ? 'StarPay Gateway' : 'Create Merchant Account'}
          </h1>
          <p className="text-xs mt-1 text-slate-400 text-center">
            {mode === 'signin'
              ? 'Sign in to access your apps and admin console'
              : 'Launch your storefront and accept UPI payments with 0% fee'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl p-1 mb-6 bg-slate-950/80 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'signin'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'register'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl p-3 text-xs bg-red-500/10 text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl p-3 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {success}
          </div>
        )}

        {mode === 'signin' ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                autoComplete="email"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all bg-slate-950 border border-slate-800 text-white focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all bg-slate-950 border border-slate-800 text-white focus:border-violet-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 mt-2 shadow-sm"
              style={{ background: 'rgb(139 92 246)', color: 'white' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition"
              >
                Don&apos;t have an account? Register as Merchant →
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Hari Singh"
                  className="w-full rounded-xl px-3.5 py-2 text-sm outline-none bg-slate-950 border border-slate-800 text-white focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Business / Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Sardar Ji Foods"
                  className="w-full rounded-xl px-3.5 py-2 text-sm outline-none bg-slate-950 border border-slate-800 text-white focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="merchant@example.com"
                autoComplete="email"
                className="w-full rounded-xl px-3.5 py-2 text-sm outline-none bg-slate-950 border border-slate-800 text-white focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                className="w-full rounded-xl px-3.5 py-2 text-sm outline-none bg-slate-950 border border-slate-800 text-white focus:border-violet-500"
              />
            </div>

            {/* Settlement Bank Options */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowBankOptions(!showBankOptions)}
                className="flex items-center justify-between w-full text-xs font-semibold text-violet-400 hover:text-violet-300 py-1"
              >
                <span>⚙️ {showBankOptions ? 'Hide Bank Details' : 'Settlement Bank Setup (Optional)'}</span>
                <span>{showBankOptions ? '▲' : '▼'}</span>
              </button>

              {showBankOptions ? (
                <div className="mt-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Settlement UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="9630937033@sbi"
                      className="w-full rounded-lg px-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 text-white focus:border-violet-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="State Bank of India"
                        className="w-full rounded-lg px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 text-white focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Account Ending</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="2441"
                        className="w-full rounded-lg px-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 text-white focus:border-violet-500"
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
                      className="w-full rounded-lg px-3 py-1.5 text-xs font-mono uppercase bg-slate-900 border border-slate-800 text-white focus:border-violet-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>Settlement: <span className="font-mono text-slate-400">{upiId}</span></span>
                  <span className="text-violet-400">Configure</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 mt-2 shadow-sm"
              style={{ background: 'rgb(139 92 246)', color: 'white' }}
            >
              {loading ? 'Creating Account…' : 'Create Merchant Account →'}
            </button>

            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition"
              >
                Already have an account? Sign In →
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs mt-6 text-slate-600">
          Secured by Supabase Auth • Dedicated Live API key provided automatically
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{ background: 'rgb(2 6 23)' }}
        >
          Loading...
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
