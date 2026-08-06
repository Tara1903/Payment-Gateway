import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: {
    default: 'Admin | StarPay',
    template: '%s | StarPay Admin',
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'rgb(2 6 23)' }}>
      {children}
    </div>
  );
}
