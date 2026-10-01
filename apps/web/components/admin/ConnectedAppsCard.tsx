import { formatDateTime } from '@starpay/shared';

interface ConnectedApp {
  name: string;
  webhookUrl: string | null;
  totalOrders: number;
  lastActive: string | null;
  status: 'active' | 'inactive';
}

function isRecentlyActive(lastActive: string | null): boolean {
  if (!lastActive) return false;
  const diff = Date.now() - new Date(lastActive).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000; // 7 days
}

function getWebhookDomain(url: string | null): string {
  if (!url) return '—';
  try {
    return new URL(url).hostname;
  } catch {
    return url.slice(0, 30) + (url.length > 30 ? '…' : '');
  }
}

export function ConnectedAppsCard({ apps }: { apps: ConnectedApp[] }) {
  if (apps.length === 0) {
    return (
      <div
        className="rounded-2xl p-6 text-center"
        style={{ background: 'rgb(13 17 37)', border: '1px solid rgb(255 255 255 / 0.06)' }}
      >
        <p style={{ color: 'rgb(100 116 139)', fontSize: '0.875rem' }}>No client apps connected yet</p>
        <p style={{ color: 'rgb(71 85 105)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          Apps appear here once they create their first order.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {apps.map((app) => {
        const active = isRecentlyActive(app.lastActive);
        return (
          <div
            key={app.name}
            className="rounded-2xl p-4"
            style={{ background: 'rgb(13 17 37)', border: '1px solid rgb(255 255 255 / 0.06)' }}
          >
            {/* App name + status badge */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: active ? 'rgb(52 211 153)' : 'rgb(100 116 139)',
                    boxShadow: active ? '0 0 6px rgb(52 211 153 / 0.5)' : 'none',
                  }}
                />
                <p className="text-sm font-semibold" style={{ color: 'rgb(248 250 252)' }}>
                  {app.name}
                </p>
              </div>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={
                  active
                    ? { background: 'rgb(52 211 153 / 0.12)', color: 'rgb(52 211 153)' }
                    : { background: 'rgb(100 116 139 / 0.12)', color: 'rgb(100 116 139)' }
                }
              >
                {active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span style={{ color: 'rgb(100 116 139)', fontSize: '0.75rem' }}>Webhook:</span>
                <span
                  className="text-xs font-mono"
                  style={{ color: 'rgb(139 92 246)' }}
                  title={app.webhookUrl ?? ''}
                >
                  {getWebhookDomain(app.webhookUrl)}
                </span>
              </div>
              <span
                className="text-xs font-mono font-semibold"
                style={{ color: 'rgb(52 211 153)' }}
              >
                {app.totalOrders} orders
              </span>
            </div>

            {/* Last active */}
            {app.lastActive && (
              <p className="text-xs mt-1.5" style={{ color: 'rgb(71 85 105)' }}>
                Last active: {formatDateTime(app.lastActive)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
