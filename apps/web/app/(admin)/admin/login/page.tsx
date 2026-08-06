'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Metadata } from 'next';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/admin/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'rgb(2 6 23)' }}>
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgb(139 92 246 / 0.15), transparent)',
        }}
      />

      <div className="card p-8 w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center gradient-brand mb-4 glow-brand">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'rgb(248 250 252)' }}>StarPay Admin</h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(100 116 139)' }}>Sign in to your admin account</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(148 163 184)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              autoComplete="email"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: 'rgb(255 255 255 / 0.04)',
                border: '1px solid rgb(255 255 255 / 0.1)',
                color: 'rgb(248 250 252)',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'rgb(139 92 246 / 0.6)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgb(255 255 255 / 0.1)'; }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(148 163 184)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: 'rgb(255 255 255 / 0.04)',
                border: '1px solid rgb(255 255 255 / 0.1)',
                color: 'rgb(248 250 252)',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'rgb(139 92 246 / 0.6)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgb(255 255 255 / 0.1)'; }}
            />
          </div>

          {error && (
            <div
              className="rounded-xl p-3 text-sm"
              style={{ background: 'rgb(248 113 113 / 0.08)', color: 'rgb(248 113 113)', border: '1px solid rgb(248 113 113 / 0.2)' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 mt-2"
            style={{ background: 'rgb(139 92 246)', color: 'white' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: 'rgb(71 85 105)' }}>
          Secured by Supabase Auth • RBAC enforced
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'rgb(2 6 23)' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
