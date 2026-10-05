-- ============================================================
-- StarPay Client Apps & Per-App Bank Account Setup
-- Migration: 007_client_apps.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS client_apps (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  owner_name          TEXT,
  owner_email         TEXT,
  api_key             TEXT NOT NULL UNIQUE,
  webhook_url         TEXT,
  return_url          TEXT,
  description         TEXT,
  
  -- Per-App Settlement Bank Account
  upi_id              TEXT NOT NULL DEFAULT '9630937033@sbi',
  account_holder_name TEXT NOT NULL DEFAULT 'Hari Singh',
  bank_name           TEXT NOT NULL DEFAULT 'State Bank of India',
  account_number      TEXT NOT NULL DEFAULT '2441',
  bank_ifsc           TEXT NOT NULL DEFAULT 'SBIN0002441',
  use_platform_bank   BOOLEAN NOT NULL DEFAULT TRUE,
  
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE client_apps ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins to view and manage client apps
CREATE POLICY "client_apps_admin_all" ON client_apps
  FOR ALL TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- Updated_at trigger
DROP TRIGGER IF EXISTS client_apps_updated_at ON client_apps;
CREATE TRIGGER client_apps_updated_at
  BEFORE UPDATE ON client_apps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed initial client apps
INSERT INTO client_apps (
  name, slug, owner_name, owner_email, api_key, webhook_url, return_url, description,
  upi_id, account_holder_name, bank_name, account_number, bank_ifsc, use_platform_bank, is_active
) VALUES 
(
  'Sardar Ji Food Corner',
  'sardar-ji-food-corner',
  'Sardar Ji',
  'support@sardar-ji.com',
  'sp_live_sardarji_8839201948271038',
  'https://sardar-ji.vercel.app/api/starpay/webhook',
  'https://sardar-ji.vercel.app/order-success',
  'Authentic North Indian Cuisine, Combos & Catering',
  '9630937033@sbi',
  'Hari Singh',
  'State Bank of India',
  '2441',
  'SBIN0002441',
  TRUE,
  TRUE
),
(
  'Ayurdhara Divya Shakti',
  'ayurdhara-divya-shakti',
  'Ayurdhara Wellness',
  'care@ayurdhara.com',
  'sp_live_ayurdhara_7719283748291038',
  'https://ayurdhara.com/api/payment/callback',
  'https://ayurdhara.com/checkout/success',
  'Ayurvedic Wellness & Herbal Remedies Store',
  '9630937033@sbi',
  'Hari Singh',
  'State Bank of India',
  '2441',
  'SBIN0002441',
  TRUE,
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET
  upi_id = EXCLUDED.upi_id,
  account_holder_name = EXCLUDED.account_holder_name,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  bank_ifsc = EXCLUDED.bank_ifsc;
