import { formatDateTime } from '@starpay/shared';

interface Device {
  id: string;
  device_name: string | null;
  last_heartbeat: string | null;
  battery_level: number | null;
  is_active: boolean;
  app_version: string | null;
}

function isOnline(lastHeartbeat: string | null): boolean {
  if (!lastHeartbeat) return false;
  const diff = Date.now() - new Date(lastHeartbeat).getTime();
  return diff < 30 * 60 * 1000; // 30 minutes
}

export function DeviceStatus({ devices }: { devices: Device[] }) {
  if (devices.length === 0) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: 'rgb(13 17 37)', border: '1px solid rgb(255 255 255 / 0.06)' }}>
        <p style={{ color: 'rgb(100 116 139)', fontSize: '0.875rem' }}>No active devices</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {devices.map((device) => {
        const online = isOnline(device.last_heartbeat);
        const battery = device.battery_level ?? 0;
        const batteryColor = battery > 50 ? 'rgb(52 211 153)' : battery > 20 ? 'rgb(251 191 36)' : 'rgb(248 113 113)';

        return (
          <div
            key={device.id}
            className="rounded-2xl p-4"
            style={{ background: 'rgb(13 17 37)', border: '1px solid rgb(255 255 255 / 0.06)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: online ? 'rgb(52 211 153)' : 'rgb(100 116 139)', boxShadow: online ? '0 0 6px rgb(52 211 153 / 0.5)' : 'none' }}
                />
                <p className="text-sm font-medium" style={{ color: 'rgb(248 250 252)' }}>{device.device_name ?? 'Companion Device'}</p>
              </div>
              <span className="text-xs" style={{ color: online ? 'rgb(52 211 153)' : 'rgb(100 116 139)' }}>
                {online ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: 'rgb(255 255 255 / 0.08)' }}>
                  <div className="h-full rounded-full" style={{ width: `${battery}%`, background: batteryColor }} />
                </div>
                <span className="text-xs font-mono" style={{ color: batteryColor }}>{battery}%</span>
              </div>
              {device.app_version && (
                <span className="text-xs" style={{ color: 'rgb(71 85 105)' }}>v{device.app_version}</span>
              )}
            </div>
            {device.last_heartbeat && (
              <p className="text-xs mt-1" style={{ color: 'rgb(71 85 105)' }}>
                Last seen: {formatDateTime(device.last_heartbeat)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
