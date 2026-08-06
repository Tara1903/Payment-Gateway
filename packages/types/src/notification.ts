export type NotificationChannel = 'EMAIL' | 'BROWSER' | 'IN_APP';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface Notification {
  id: string;
  orderId: string | null;
  channel: NotificationChannel;
  recipient: string;
  subject: string | null;
  body: string | null;
  status: NotificationStatus;
  attempts: number;
  sentAt: string | null;
  createdAt: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  orderId?: string;
}
