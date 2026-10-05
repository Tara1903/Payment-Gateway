'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/merchant', label: 'Merchant Portal', icon: '🏪' },
  { href: '/admin/orders', label: 'Orders', icon: '💳' },
  { href: '/admin/apps', label: 'Connected Apps', icon: '🔗' },
  { href: '/admin/verifications', label: 'Verifications', icon: '🔍' },
  { href: '/admin/fraud', label: 'Fraud Flags', icon: '🛡️' },
  { href: '/admin/audit', label: 'Audit Log', icon: '📜' },
  { href: '/admin/devices', label: 'Devices', icon: '📱' },
];

const MOBILE_BOTTOM_NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/merchant', label: 'Merchant', icon: '🏪' },
  { href: '/admin/orders', label: 'Orders', icon: '💳' },
  { href: '/admin/apps', label: 'Apps', icon: '🔗' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  // Close drawer when pathname changes
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <>
      {/* =========================================================
          1. MOBILE TOP APP BAR (Sticky header on <md screens)
         ========================================================= */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center gradient-brand shadow-sm">
            <span className="text-sm">⚡</span>
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">StarPay</span>
            <span className="text-[10px] text-slate-400 block -mt-0.5">Admin Console</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </span>
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition active:scale-95"
            aria-label="Open navigation menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* =========================================================
          2. MOBILE SLIDE-OUT DRAWER WITH BACKDROP
         ========================================================= */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 animate-fade-in">
          {/* Backdrop */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer content */}
          <div className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-slate-950 border-l border-slate-800 p-5 flex flex-col justify-between shadow-2xl safe-top safe-bottom">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center gradient-brand">
                    <span className="text-xs">⚡</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">Navigation</div>
                    {userEmail && <div className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">{userEmail}</div>}
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* Links */}
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <Link
                  href="/admin/settings"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    pathname === '/admin/settings'
                      ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span className="text-base">⚙️</span>
                  <span>Settings</span>
                </Link>
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Link
                href="/register"
                className="w-full block text-center py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white"
              >
                + Register New Merchant
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition"
              >
                Sign Out ⎋
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          3. NATIVE MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom on <md)
         ========================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 safe-bottom">
        <div className="grid grid-cols-5 h-14 items-center">
          {MOBILE_BOTTOM_NAV.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center h-full transition ${
                  isActive ? 'text-violet-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          {/* More / Menu Button */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="flex flex-col items-center justify-center h-full text-slate-400 hover:text-slate-200 transition"
          >
            <span className="text-lg leading-none">☰</span>
            <span className="text-[10px] mt-1 tracking-tight">More</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          4. DESKTOP SIDEBAR (Sticky on md+ screens)
         ========================================================= */}
      <aside
        className="hidden md:flex w-60 flex-shrink-0 flex-col"
        style={{
          background: 'rgb(13 17 37)',
          borderRight: '1px solid rgb(255 255 255 / 0.06)',
          height: '100vh',
          position: 'sticky',
          top: 0,
        }}
      >
        {/* Logo */}
        <div className="p-5 border-b" style={{ borderColor: 'rgb(255 255 255 / 0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center gradient-brand shadow-sm">
              <span className="text-sm">⚡</span>
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: 'rgb(248 250 252)' }}>StarPay</p>
              <p className="text-xs" style={{ color: 'rgb(71 85 105)' }}>Admin Console</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: isActive ? 'rgb(139 92 246 / 0.15)' : 'transparent',
                    color: isActive ? 'rgb(167 139 250)' : 'rgb(100 116 139)',
                    border: isActive ? '1px solid rgb(139 92 246 / 0.25)' : '1px solid transparent',
                  }}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t flex items-center justify-between" style={{ borderColor: 'rgb(255 255 255 / 0.06)' }}>
          <Link
            href="/admin/settings"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-slate-400 hover:text-slate-200"
          >
            <span>⚙️</span> Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="text-xs px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
            title="Sign out"
          >
            Sign out ⎋
          </button>
        </div>
      </aside>
    </>
  );
}
