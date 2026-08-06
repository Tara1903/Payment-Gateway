import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { redirect } from 'next/navigation';
import { formatDateTime } from '@starpay/shared';

export const metadata: Metadata = { title: 'Android Devices' };
export const dynamic = 'force-dynamic';

function isOnline(lastHeartbeat: string | null): boolean {
  if (!lastHeartbeat) return false;
  return Date.now() - new Date(lastHeartbeat).getTime() < 30 * 60 * 1000;
}

export default async function DevicesPage() {
  const auth = await requireAdminRole('READ_ONLY');
  if (!auth.ok) redirect('/admin/login');

  const supabase = createAdminClient();
  const { data: devices } = await supabase
    .from('android_devices')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8" style={{ color: 'rgb(248 250 252)' }}>Android Devices</h1>

      {!devices?.length ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📱</p>
          <p style={{ color: 'rgb(148 163 184)' }}>No devices registered yet.</p>
          <p className="text-sm mt-2" style={{ color: 'rgb(71 85 105)' }}>The Android companion app will register automatically on first heartbeat.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {devices.map((device) => {
            const online = isOnline(device.last_heartbeat);
            const battery = device.battery_level ?? 0;
            return (
              <div key={device.id} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: online ? 'rgb(52 211 153)' : 'rgb(100 116 139)', boxShadow: online ? '0 0 8px rgb(52 211 153 / 0.5)' : 'none' }}
                    />
                    <p className="font-medium" style={{ color: 'rgb(248 250 252)' }}>{device.device_name ?? 'Unknown Device'}</p>
                  </div>
                  <span className="text-xs" style={{ color: online ? 'rgb(52 211 153)' : 'rgb(100 116 139)' }}>
                    {online ? 'Online' : 'Offline'}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'rgb(71 85 105)' }}>Device ID</p>
                    <p className="text-xs font-mono" style={{ color: 'rgb(148 163 184)' }}>{device.device_id.slice(0, 12)}…</p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'rgb(71 85 105)' }}>Battery</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full" style={{ background: 'rgb(255 255 255 / 0.08)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${battery}%`,
                            background: battery > 50 ? 'rgb(52 211 153)' : battery > 20 ? 'rgb(251 191 36)' : 'rgb(248 113 113)',
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono" style={{ color: 'rgb(148 163 184)' }}>{battery}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs" style={{ color: 'rgb(71 85 105)' }}>App Version</p>
                      <p className="text-xs font-mono" style={{ color: 'rgb(148 163 184)' }}>{device.app_version ?? 'Unknown'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: 'rgb(71 85 105)' }}>Queue Depth</p>
                      <p className="text-xs font-mono" style={{ color: device.queue_depth > 0 ? 'rgb(251 191 36)' : 'rgb(52 211 153)' }}>{device.queue_depth}</p>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: 'rgb(71 85 105)' }}>
                    Last seen: {device.last_heartbeat ? formatDateTime(device.last_heartbeat) : 'Never'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
