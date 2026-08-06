-- ============================================================
-- StarPay Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMERATIONS
-- ============================================================

CREATE TYPE order_status AS ENUM (
  'CREATED',
  'AWAITING_PAYMENT',
  'VERIFYING',
  'PAID',
  'PENDING_VERIFICATION',
  'FAILED',
  'REFUNDED'
);

CREATE TYPE txn_source AS ENUM (
  'ANDROID_SMS',
  'ANDROID_NOTIFICATION',
  'MANUAL_UTR',
  'MANUAL_SCREENSHOT',
  'ADMIN'
);

CREATE TYPE txn_status AS ENUM (
  'RECEIVED',
  'VERIFYING',
  'VERIFIED',
  'REJECTED',
  'DUPLICATE',
  'FRAUD_HOLD'
);

CREATE TYPE admin_role AS ENUM (
  'SUPER_ADMIN',
  'ADMIN',
  'SUPPORT',
  'FINANCE',
  'READ_ONLY'
);

CREATE TYPE timeline_event_type AS ENUM (
  'ORDER_CREATED',
  'QR_GENERATED',
  'INTENT_OPENED',
  'ANDROID_EVENT_RECEIVED',
  'SMS_PARSED',
  'VERIFICATION_STARTED',
  'AMOUNT_VERIFIED',
  'TIME_WINDOW_CHECKED',
  'UTR_UNIQUENESS_CHECKED',
  'FRAUD_CHECK_PASSED',
  'FRAUD_CHECK_FAILED',
  'APPROVED',
  'FALLBACK_TRIGGERED',
  'MANUAL_SUBMITTED',
  'MANUAL_APPROVED',
  'MANUAL_REJECTED',
  'INVOICE_GENERATED',
  'NOTIFICATION_SENT',
  'ORDER_EXPIRED',
  'ORDER_FAILED'
);

-- ============================================================
-- MERCHANTS
-- ============================================================

CREATE TABLE merchants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  upi_id          TEXT NOT NULL,
  bank_account    TEXT,
  bank_ifsc       TEXT,
  webhook_secret  TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT merchants_upi_id_unique UNIQUE (upi_id)
);

COMMENT ON TABLE merchants IS 'Merchant accounts. StarPay Phase 1 has exactly one merchant (Ayurdhara).';
COMMENT ON COLUMN merchants.webhook_secret IS 'Rotatable HMAC-SHA256 secret used to verify Android companion webhook requests.';

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT,
  email           TEXT,
  phone           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE customers IS 'Customer records. One customer may have multiple orders.';

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_ref       TEXT NOT NULL,
  amount          NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  reserved_amount NUMERIC(12, 2) NOT NULL CHECK (reserved_amount > 0),
  currency        TEXT NOT NULL DEFAULT 'INR',
  description     TEXT,
  status          order_status NOT NULL DEFAULT 'CREATED',
  payment_token   TEXT NOT NULL,
  upi_txn_ref     TEXT,
  expires_at      TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT orders_order_ref_unique UNIQUE (order_ref)
);

COMMENT ON TABLE orders IS 'Payment orders. Each order has a reserved_amount with a paise disambiguator for UPI matching.';
COMMENT ON COLUMN orders.amount IS 'Original requested amount (e.g. 500.00).';
COMMENT ON COLUMN orders.reserved_amount IS 'Amount shown to customer with paise disambiguator (e.g. 500.07). Used for UPI matching.';
COMMENT ON COLUMN orders.payment_token IS 'Short-lived signed JWT scoped to this order. Issued at creation.';
COMMENT ON COLUMN orders.upi_txn_ref IS 'The tr= param used in the UPI QR/intent URL, unique per order.';

-- ============================================================
-- TRANSACTIONS
-- ============================================================

CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
  utr             TEXT,
  amount          NUMERIC(12, 2) NOT NULL,
  sender_name     TEXT,
  sender_upi      TEXT,
  bank_ref        TEXT,
  payment_mode    TEXT NOT NULL DEFAULT 'UPI',
  source          txn_source NOT NULL,
  raw_payload     JSONB,
  status          txn_status NOT NULL DEFAULT 'RECEIVED',
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE transactions IS 'Payment transaction events received from Android companion or submitted manually.';
COMMENT ON COLUMN transactions.utr IS 'UPI Transaction Reference number. 12-digit unique identifier from NPCI.';
COMMENT ON COLUMN transactions.raw_payload IS 'Raw SMS or notification text + parsed data for audit purposes.';

-- ============================================================
-- VERIFICATION EVENTS (pipeline step log)
-- ============================================================

CREATE TABLE verification_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
  transaction_id  UUID REFERENCES transactions(id) ON DELETE CASCADE,
  pipeline_step   TEXT NOT NULL,
  result          TEXT NOT NULL CHECK (result IN ('PASS', 'FAIL', 'SKIP')),
  reason          TEXT,
  meta            JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE verification_events IS 'Individual pipeline step outcomes for each verification attempt.';

-- ============================================================
-- MANUAL VERIFICATIONS (fallback submissions)
-- ============================================================

CREATE TABLE manual_verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  submitted_by    TEXT,
  utr_entered     TEXT,
  screenshot_url  TEXT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by     UUID,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE manual_verifications IS 'Manual payment verification submissions from customers who paid but auto-verification failed.';
COMMENT ON COLUMN manual_verifications.screenshot_url IS 'Path in Supabase Storage (private bucket). Never expose directly — serve via signed URL.';

-- ============================================================
-- FRAUD FLAGS
-- ============================================================

CREATE TABLE fraud_flags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
  transaction_id  UUID REFERENCES transactions(id) ON DELETE CASCADE,
  rule_triggered  TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  details         JSONB,
  resolved        BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by     UUID,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE fraud_flags IS 'Fraud detection rule trigger records. Reviewed and resolved by admin.';

-- ============================================================
-- AUDIT LOGS (append-only)
-- ============================================================

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type      TEXT NOT NULL CHECK (actor_type IN ('SYSTEM', 'ANDROID', 'ADMIN', 'CUSTOMER')),
  actor_id        TEXT,
  event_type      TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID,
  payload         JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Immutable append-only audit log. RLS prevents UPDATE and DELETE.';

-- ============================================================
-- ANDROID DEVICES
-- ============================================================

CREATE TABLE android_devices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  device_id       TEXT NOT NULL,
  device_name     TEXT,
  last_heartbeat  TIMESTAMPTZ,
  battery_level   INTEGER CHECK (battery_level BETWEEN 0 AND 100),
  app_version     TEXT,
  queue_depth     INTEGER NOT NULL DEFAULT 0 CHECK (queue_depth >= 0),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT android_devices_device_id_unique UNIQUE (device_id)
);

COMMENT ON TABLE android_devices IS 'Registered Android companion devices. Tracks heartbeat and health.';

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  channel         TEXT NOT NULL CHECK (channel IN ('EMAIL', 'BROWSER', 'IN_APP')),
  recipient       TEXT NOT NULL,
  subject         TEXT,
  body            TEXT,
  status          TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  attempts        INTEGER NOT NULL DEFAULT 0,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'Outbound notification records. Resend for email, Web Push for browser.';

-- ============================================================
-- INVOICES
-- ============================================================

CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number  TEXT NOT NULL,
  html_url        TEXT,
  pdf_url         TEXT,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT invoices_order_id_unique UNIQUE (order_id),
  CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number)
);

COMMENT ON TABLE invoices IS 'Generated invoices. HTML rendered first, PDF generated from HTML and stored in Supabase Storage.';

-- ============================================================
-- ADMIN USERS (extends Supabase Auth)
-- ============================================================

CREATE TABLE admin_users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  role            admin_role NOT NULL DEFAULT 'READ_ONLY',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_users_email_unique UNIQUE (email)
);

COMMENT ON TABLE admin_users IS 'Admin user profiles with RBAC roles. Extends Supabase auth.users.';

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
