export interface AndroidWebhookPayload {
  deviceId: string;
  timestamp: string;
  eventType: 'SMS_RECEIVED' | 'NOTIFICATION_RECEIVED';
  source: 'ANDROID_SMS' | 'ANDROID_NOTIFICATION';
  raw: string;
  parsed: {
    amount: number;
    utr: string;
    senderName: string | null;
    senderUpi: string | null;
    bankRef: string | null;
    txnTimestamp: string;
  };
  signature: string;
}

export interface HeartbeatPayload {
  deviceId: string;
  batteryLevel: number;
  appVersion: string;
  queueDepth: number;
  timestamp: string;
}

export interface AndroidDevice {
  id: string;
  merchantId: string;
  deviceId: string;
  deviceName: string | null;
  lastHeartbeat: string | null;
  batteryLevel: number | null;
  appVersion: string | null;
  queueDepth: number;
  isActive: boolean;
  createdAt: string;
}
