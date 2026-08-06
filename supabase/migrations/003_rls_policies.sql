-- ============================================================
-- StarPay Row Level Security Policies
-- Migration: 003_rls_policies.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE android_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SERVICE ROLE: Bypass RLS for all server-side operations
-- (Supabase service role key bypasses RLS automatically)
-- ============================================================

-- MERCHANTS: Admins can read; only service role writes
CREATE POLICY "merchants_admin_read" ON merchants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

-- ORDERS: Admins read all; anon reads via payment token (handled in API route, not RLS)
CREATE POLICY "orders_admin_read" ON orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

-- TRANSACTIONS: Admins only
CREATE POLICY "transactions_admin_read" ON transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

-- VERIFICATION EVENTS: Admins only
CREATE POLICY "verification_events_admin_read" ON verification_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

-- MANUAL VERIFICATIONS: Admins read all; INSERT handled server-side
CREATE POLICY "manual_verifications_admin_read" ON manual_verifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "manual_verifications_admin_update" ON manual_verifications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = TRUE
        AND role IN ('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
    )
  );

-- FRAUD FLAGS: Admins only
CREATE POLICY "fraud_flags_admin_read" ON fraud_flags
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = TRUE
        AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

CREATE POLICY "fraud_flags_admin_update" ON fraud_flags
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = TRUE
        AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- AUDIT LOGS: Admins read; NO UPDATE or DELETE for anyone
CREATE POLICY "audit_logs_admin_read" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = TRUE
        AND role IN ('SUPER_ADMIN', 'ADMIN', 'FINANCE')
    )
  );
-- Note: No INSERT policy — inserts done via service role only.
-- No UPDATE or DELETE policies — append-only by design.

-- ANDROID DEVICES: Admins read
CREATE POLICY "android_devices_admin_read" ON android_devices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

-- NOTIFICATIONS: Admins read
CREATE POLICY "notifications_admin_read" ON notifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

-- INVOICES: Finance + Admins read
CREATE POLICY "invoices_admin_read" ON invoices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = TRUE
        AND role IN ('SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'FINANCE')
    )
  );

-- ADMIN USERS: Super admin manages; users see themselves
CREATE POLICY "admin_users_self_read" ON admin_users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "admin_users_super_admin_read" ON admin_users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'SUPER_ADMIN' AND au.is_active = TRUE
    )
  );

CREATE POLICY "admin_users_super_admin_insert" ON admin_users
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'SUPER_ADMIN' AND au.is_active = TRUE
    )
  );

CREATE POLICY "admin_users_super_admin_update" ON admin_users
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'SUPER_ADMIN' AND au.is_active = TRUE
    )
  );

-- CUSTOMERS: Admins only
CREATE POLICY "customers_admin_read" ON customers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );
