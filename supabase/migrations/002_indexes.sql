-- ============================================================
-- StarPay Indexes
-- Migration: 002_indexes.sql
-- ============================================================

-- Orders
CREATE INDEX idx_orders_merchant_status ON orders (merchant_id, status);
CREATE INDEX idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX idx_orders_upi_txn_ref ON orders (upi_txn_ref) WHERE upi_txn_ref IS NOT NULL;
CREATE INDEX idx_orders_customer ON orders (customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_paid_at ON orders (paid_at DESC) WHERE paid_at IS NOT NULL;

-- Unique partial index for amount-match during verification
-- Only one order can hold a given reserved_amount in AWAITING_PAYMENT state
CREATE UNIQUE INDEX idx_orders_reserved_amount_awaiting
  ON orders (reserved_amount)
  WHERE status = 'AWAITING_PAYMENT';

-- Transactions
CREATE UNIQUE INDEX idx_transactions_utr_unique
  ON transactions (utr)
  WHERE utr IS NOT NULL;
CREATE INDEX idx_transactions_order ON transactions (order_id);
CREATE INDEX idx_transactions_merchant ON transactions (merchant_id);
CREATE INDEX idx_transactions_status ON transactions (status);
CREATE INDEX idx_transactions_created_at ON transactions (created_at DESC);

-- Verification Events
CREATE INDEX idx_verification_events_order ON verification_events (order_id);
CREATE INDEX idx_verification_events_transaction ON verification_events (transaction_id);

-- Manual Verifications
CREATE INDEX idx_manual_verifications_order_status
  ON manual_verifications (order_id, status);
CREATE INDEX idx_manual_verifications_status ON manual_verifications (status);
CREATE INDEX idx_manual_verifications_created_at ON manual_verifications (created_at DESC);

-- Fraud Flags
CREATE INDEX idx_fraud_flags_order ON fraud_flags (order_id);
CREATE INDEX idx_fraud_flags_unresolved ON fraud_flags (severity, created_at DESC)
  WHERE resolved = FALSE;

-- Audit Logs
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs (event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_type, actor_id);

-- Android Devices
CREATE INDEX idx_android_devices_merchant ON android_devices (merchant_id, is_active);

-- Notifications
CREATE INDEX idx_notifications_order ON notifications (order_id);
CREATE INDEX idx_notifications_status ON notifications (status);

-- Invoices
CREATE INDEX idx_invoices_order ON invoices (order_id);
