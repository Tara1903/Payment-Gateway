-- ============================================================
-- StarPay RBAC Helper Function
-- Migration: 004_rbac.sql
-- ============================================================

-- Helper function: get the current admin user's role
CREATE OR REPLACE FUNCTION get_admin_role()
RETURNS TEXT AS $$
  SELECT role::TEXT
  FROM admin_users
  WHERE id = auth.uid() AND is_active = TRUE
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function: check if current user has a minimum role
-- Role hierarchy: SUPER_ADMIN > ADMIN > SUPPORT > FINANCE > READ_ONLY
CREATE OR REPLACE FUNCTION has_admin_role(minimum_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_role TEXT;
  role_rank INTEGER;
  required_rank INTEGER;
BEGIN
  SELECT role::TEXT INTO current_role
  FROM admin_users
  WHERE id = auth.uid() AND is_active = TRUE
  LIMIT 1;

  IF current_role IS NULL THEN
    RETURN FALSE;
  END IF;

  role_rank := CASE current_role
    WHEN 'SUPER_ADMIN' THEN 5
    WHEN 'ADMIN'       THEN 4
    WHEN 'SUPPORT'     THEN 3
    WHEN 'FINANCE'     THEN 2
    WHEN 'READ_ONLY'   THEN 1
    ELSE 0
  END;

  required_rank := CASE minimum_role
    WHEN 'SUPER_ADMIN' THEN 5
    WHEN 'ADMIN'       THEN 4
    WHEN 'SUPPORT'     THEN 3
    WHEN 'FINANCE'     THEN 2
    WHEN 'READ_ONLY'   THEN 1
    ELSE 99
  END;

  RETURN role_rank >= required_rank;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
