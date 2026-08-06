import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { redirect } from 'next/navigation';
import { formatDateTime } from '@starpay/shared';

export const metadata: Metadata = { title: 'Audit Log' };
export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const auth = await requireAdminRole('FINANCE');
  if (!auth.ok) redirect('/admin/login');

  const supabase = createAdminClient();
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, actor_type, actor_id, event_type, entity_type, entity_id, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const ACTOR_COLORS: Record<string, string> = {
    SYSTEM: 'rgb(96 165 250)',
    ANDROID: 'rgb(139 92 246)',
    ADMIN: 'rgb(52 211 153)',
    CUSTOMER: 'rgb(251 191 36)',
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'rgb(248 250 252)' }}>Audit Log</h1>
      <p className="text-sm mb-8" style={{ color: 'rgb(100 116 139)' }}>Immutable system audit trail — last 100 entries</p>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgb(255 255 255 / 0.06)' }}>
                {['Time', 'Actor', 'Event', 'Entity', 'ID'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'rgb(71 85 105)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(logs ?? []).map((log, idx) => (
                <tr
                  key={log.id}
                  style={{ borderBottom: idx < (logs?.length ?? 0) - 1 ? '1px solid rgb(255 255 255 / 0.04)' : 'none' }}
                >
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-mono" style={{ color: 'rgb(100 116 139)' }}>{formatDateTime(log.created_at)}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${ACTOR_COLORS[log.actor_type] ?? 'rgb(100 116 139)'}20`, color: ACTOR_COLORS[log.actor_type] ?? 'rgb(100 116 139)' }}
                    >
                      {log.actor_type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-mono" style={{ color: 'rgb(248 250 252)' }}>{log.event_type}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs" style={{ color: 'rgb(148 163 184)' }}>{log.entity_type}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-mono" style={{ color: 'rgb(71 85 105)' }}>{log.entity_id?.slice(0, 8) ?? '—'}…</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
