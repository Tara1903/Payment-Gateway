-- ============================================================
-- StarPay Initial Seed Data
-- Migration: 007_seed_initial_merchant.sql
-- ============================================================

INSERT INTO merchants (id, name, upi_id, bank_account, bank_ifsc, webhook_secret, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Hari Singh',
  '9630937033@sbi',
  'STATE BANK OF INDIA 2441',
  'SBIN0002441',
  'default-starpay-companion-hmac-secret-key',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  upi_id = EXCLUDED.upi_id,
  bank_account = EXCLUDED.bank_account,
  bank_ifsc = EXCLUDED.bank_ifsc;
