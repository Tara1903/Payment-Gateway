import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { redirect } from 'next/navigation';
import { formatDateTime } from '@starpay/shared';

export const metadata: Metadata = { title: 'Fraud Flags' };
export const dynamic = 'force-dynamic';

const SEVERITY_STYLES: Record<string, { bg: string; text: string }> = {
  CRITICAL: { bg: 'rgb(248 113 113 / 0.1)', text: 'rgb(248 113 113)' },
  HIGH: { bg: 'rgb(251 191 36 / 0.1)', text: 'rgb(251 191 36)' },
  MEDIUM: { bg: 'rgb(251 146 60 / 0.1)', text: 'rgb(251 146 60)' },
  LOW: { bg: 'rgb(96 165 250 / 0.1)', text: 'rgb(96 165 250)' },
};

export default async function FraudPage() {
  const auth = await requireAdminRole('ADMIN');
  if (!auth.ok) redirect('/admin/login');

  const supabase = createAdminClient();
  const { data: flags } = await supabase
    .from('fraud_flags')
    .select('*')
    .eq('resolved', false)
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'rgb(248 250 252)' }}>Fraud Flags</h1>
      <p className="text-sm mb-8" style={{ color: 'rgb(100 116 139)' }}>{flags?.length ?? 0} unresolved flags</p>

      {!flags?.length ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🛡️</p>
          <p style={{ color: 'rgb(148 163 184)' }}>No active fraud flags. System is clean.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {flags.map((flag) => {
            const sev = SEVERITY_STYLES[flag.severity] ?? SEVERITY_STYLES.LOW!;
            return (
              <div key={flag.id} className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{ background: sev.bg, color: sev.text }}
                  >
                    {flag.severity}
                  </span>
                  <p className="font-mono text-sm font-medium" style={{ color: 'rgb(248 250 252)' }}>{flag.rule_triggered}</p>
                  <span className="ml-auto text-xs" style={{ color: 'rgb(71 85 105)' }}>{formatDateTime(flag.created_at)}</span>
                </div>
                {flag.details && (
                  <pre
                    className="rounded-xl p-3 text-xs overflow-auto"
                    style={{ background: 'rgb(255 255 255 / 0.03)', color: 'rgb(148 163 184)', fontFamily: 'monospace' }}
                  >
                    {JSON.stringify(flag.details, null, 2)}
                  </pre>
                )}
                {flag.order_id && (
                  <a href={`/admin/orders/${flag.order_id}`} className="mt-3 text-sm inline-block" style={{ color: 'rgb(139 92 246)' }}>
                    View Order →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
