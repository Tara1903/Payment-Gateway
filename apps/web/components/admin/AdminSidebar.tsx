'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/orders', label: 'Orders', icon: '💳' },
  { href: '/admin/verifications', label: 'Verifications', icon: '🔍' },
  { href: '/admin/fraud', label: 'Fraud Flags', icon: '🛡️' },
  { href: '/admin/audit', label: 'Audit Log', icon: '📜' },
  { href: '/admin/devices', label: 'Devices', icon: '📱' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col"
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
          <div className="w-8 h-8 rounded-lg flex items-center justify-center gradient-brand">
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
      <div className="p-3 border-t" style={{ borderColor: 'rgb(255 255 255 / 0.06)' }}>
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: 'rgb(100 116 139)' }}
        >
          <span>⚙️</span> Settings
        </Link>
      </div>
    </aside>
  );
}
