-- ============================================================
-- StarPay Database Functions
-- Migration: 006_functions.sql
-- ============================================================

-- ============================================================
-- FUNCTION: Reserve a unique paise amount for an order
-- Adds a random 1-99 paise disambiguator to the base amount.
-- Retries if collision detected (max 10 attempts).
-- ============================================================
CREATE OR REPLACE FUNCTION reserve_unique_amount(
  p_base_amount NUMERIC(12,2),
  p_max_attempts INTEGER DEFAULT 10
)
RETURNS NUMERIC(12,2) AS $$
DECLARE
  v_disambiguator INTEGER;
  v_candidate     NUMERIC(12,2);
  v_attempt       INTEGER := 0;
BEGIN
  LOOP
    v_attempt := v_attempt + 1;
    IF v_attempt > p_max_attempts THEN
      RAISE EXCEPTION 'Could not reserve a unique amount after % attempts', p_max_attempts;
    END IF;

    -- Pick a random disambiguator between 1 and 99
    v_disambiguator := floor(random() * 99 + 1)::INTEGER;
    v_candidate := p_base_amount + (v_disambiguator::NUMERIC / 100);

    -- Check if this amount is already reserved by a currently active order
    IF NOT EXISTS (
      SELECT 1 FROM orders
      WHERE reserved_amount = v_candidate
        AND status = 'AWAITING_PAYMENT'
    ) THEN
      RETURN v_candidate;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reserve_unique_amount IS
  'Reserves a unique reserved_amount for a new order by adding a random 1-99 paise disambiguator. Used to identify which order an incoming UPI payment belongs to.';

-- ============================================================
-- FUNCTION: Get next sequence number for order_ref generation
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS order_ref_seq START 1;

CREATE OR REPLACE FUNCTION next_order_sequence()
RETURNS INTEGER AS $$
  SELECT nextval('order_ref_seq')::INTEGER;
$$ LANGUAGE SQL;

-- ============================================================
-- FUNCTION: Get next sequence number for invoice_number generation
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION next_invoice_sequence()
RETURNS INTEGER AS $$
  SELECT nextval('invoice_number_seq')::INTEGER;
$$ LANGUAGE SQL;

-- ============================================================
-- FUNCTION: Append a timeline event
-- Called from API routes via service role.
-- ============================================================
CREATE OR REPLACE FUNCTION append_timeline_event(
  p_order_id    UUID,
  p_event       timeline_event_type,
  p_actor_type  TEXT,
  p_actor_id    TEXT,
  p_label       TEXT,
  p_description TEXT DEFAULT NULL,
  p_meta        JSONB DEFAULT '{}',
  p_occurred_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO order_timeline (
    order_id, event, actor_type, actor_id, label, description, meta, occurred_at
  ) VALUES (
    p_order_id, p_event, p_actor_type, p_actor_id, p_label, p_description, p_meta, p_occurred_at
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION append_timeline_event IS
  'Appends a single timeline milestone for an order. Called by API routes via service role.';

-- ============================================================
-- FUNCTION: Get full timeline for an order (ordered)
-- ============================================================
CREATE OR REPLACE FUNCTION get_order_timeline(p_order_id UUID)
RETURNS TABLE (
  id          UUID,
  order_id    UUID,
  event       TEXT,
  actor_type  TEXT,
  actor_id    TEXT,
  label       TEXT,
  description TEXT,
  meta        JSONB,
  occurred_at TIMESTAMPTZ
) AS $$
  SELECT
    id, order_id, event::TEXT, actor_type, actor_id, label, description, meta, occurred_at
  FROM order_timeline
  WHERE order_id = p_order_id
  ORDER BY occurred_at ASC, id ASC;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_order_timeline IS
  'Returns all timeline events for an order, ordered chronologically by occurred_at then id.';
