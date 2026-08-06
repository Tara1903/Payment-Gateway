export type TimelineEventType =
  // Order lifecycle
  | 'ORDER_CREATED'
  | 'QR_GENERATED'
  | 'INTENT_OPENED'
  // Android detection
  | 'ANDROID_EVENT_RECEIVED'
  | 'SMS_PARSED'
  // Verification pipeline
  | 'VERIFICATION_STARTED'
  | 'AMOUNT_VERIFIED'
  | 'TIME_WINDOW_CHECKED'
  | 'UTR_UNIQUENESS_CHECKED'
  | 'FRAUD_CHECK_PASSED'
  | 'FRAUD_CHECK_FAILED'
  // Outcomes
  | 'APPROVED'
  | 'FALLBACK_TRIGGERED'
  | 'MANUAL_SUBMITTED'
  | 'MANUAL_APPROVED'
  | 'MANUAL_REJECTED'
  // Post-payment
  | 'INVOICE_GENERATED'
  | 'NOTIFICATION_SENT'
  // Failure/edge
  | 'ORDER_EXPIRED'
  | 'ORDER_FAILED';

export type TimelineActorType = 'SYSTEM' | 'ANDROID' | 'CUSTOMER' | 'ADMIN';

export interface TimelineEvent {
  id: string;
  orderId: string;
  event: TimelineEventType;
  actorType: TimelineActorType;
  actorId: string | null;
  label: string;
  description: string | null;
  meta: Record<string, unknown>;
  occurredAt: string;
}

export interface AppendTimelineInput {
  orderId: string;
  event: TimelineEventType;
  actorType: TimelineActorType;
  actorId?: string;
  label: string;
  description?: string;
  meta?: Record<string, unknown>;
  occurredAt?: string; // defaults to NOW() if not provided
}
