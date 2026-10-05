import type { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen" style={{ background: 'rgb(2 6 23)' }}>
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-auto pb-20 md:pb-8">
        {children}
      </main>
    </div>
  );
}
