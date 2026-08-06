// Auto-generated style database types for StarPay
// Manually maintained until `supabase gen types typescript` can be run

export type OrderStatus = 'CREATED' | 'AWAITING_PAYMENT' | 'VERIFYING' | 'PAID' | 'PENDING_VERIFICATION' | 'FAILED' | 'REFUNDED';
export type TxnSource = 'ANDROID_SMS' | 'ANDROID_NOTIFICATION' | 'MANUAL_UTR' | 'MANUAL_SCREENSHOT' | 'ADMIN';
export type TxnStatus = 'RECEIVED' | 'VERIFYING' | 'VERIFIED' | 'REJECTED' | 'DUPLICATE' | 'FRAUD_HOLD';
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT' | 'FINANCE' | 'READ_ONLY';
export type TimelineEventType = 'ORDER_CREATED' | 'QR_GENERATED' | 'INTENT_OPENED' | 'ANDROID_EVENT_RECEIVED' | 'SMS_PARSED' | 'VERIFICATION_STARTED' | 'AMOUNT_VERIFIED' | 'TIME_WINDOW_CHECKED' | 'UTR_UNIQUENESS_CHECKED' | 'FRAUD_CHECK_PASSED' | 'FRAUD_CHECK_FAILED' | 'APPROVED' | 'FALLBACK_TRIGGERED' | 'MANUAL_SUBMITTED' | 'MANUAL_APPROVED' | 'MANUAL_REJECTED' | 'INVOICE_GENERATED' | 'NOTIFICATION_SENT' | 'ORDER_EXPIRED' | 'ORDER_FAILED';

export interface DbMerchant {
  id: string;
  name: string;
  upi_id: string;
  bank_account: string | null;
  bank_ifsc: string | null;
  webhook_secret: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCustomer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface DbOrder {
  id: string;
  merchant_id: string;
  customer_id: string | null;
  order_ref: string;
  amount: number;
  reserved_amount: number;
  currency: string;
  description: string | null;
  status: OrderStatus;
  payment_token: string;
  upi_txn_ref: string | null;
  expires_at: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DbTransaction {
  id: string;
  order_id: string | null;
  merchant_id: string;
  utr: string | null;
  amount: number;
  sender_name: string | null;
  sender_upi: string | null;
  bank_ref: string | null;
  payment_mode: string;
  source: TxnSource;
  raw_payload: Record<string, unknown> | null;
  status: TxnStatus;
  verified_at: string | null;
  created_at: string;
}

export interface DbOrderTimeline {
  id: string;
  order_id: string;
  event: TimelineEventType;
  actor_type: string;
  actor_id: string | null;
  label: string;
  description: string | null;
  meta: Record<string, unknown>;
  occurred_at: string;
}

export interface DbManualVerification {
  id: string;
  order_id: string;
  submitted_by: string | null;
  utr_entered: string | null;
  screenshot_url: string | null;
  notes: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface DbFraudFlag {
  id: string;
  order_id: string | null;
  transaction_id: string | null;
  rule_triggered: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: Record<string, unknown> | null;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface DbAndroidDevice {
  id: string;
  merchant_id: string;
  device_id: string;
  device_name: string | null;
  last_heartbeat: string | null;
  battery_level: number | null;
  app_version: string | null;
  queue_depth: number;
  is_active: boolean;
  created_at: string;
}

export interface DbAdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbInvoice {
  id: string;
  order_id: string;
  invoice_number: string;
  html_url: string | null;
  pdf_url: string | null;
  generated_at: string;
}

export interface DbAuditLog {
  id: string;
  actor_type: string;
  actor_id: string | null;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  payload: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
