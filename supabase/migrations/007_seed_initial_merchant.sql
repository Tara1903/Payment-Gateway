-- ============================================================
-- StarPay Initial Seed Data
-- Migration: 007_seed_initial_merchant.sql
-- ============================================================

INSERT INTO merchants (id, name, upi_id, bank_account, bank_ifsc, webhook_secret, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Ayurdhara',
  'ayurdhara@upi',
  '1234567890',
  'SBIN0001234',
  'default-starpay-companion-hmac-secret-key',
  TRUE
)
ON CONFLICT (upi_id) DO NOTHING;
