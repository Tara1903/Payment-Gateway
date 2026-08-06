-- ============================================================
-- StarPay Order Timeline
-- Migration: 005_order_timeline.sql
-- ============================================================

CREATE TABLE order_timeline (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event           timeline_event_type NOT NULL,
  actor_type      TEXT NOT NULL CHECK (actor_type IN ('SYSTEM', 'ANDROID', 'CUSTOMER', 'ADMIN')),
  actor_id        TEXT,
  label           TEXT NOT NULL,
  description     TEXT,
  meta            JSONB NOT NULL DEFAULT '{}',
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE order_timeline IS 'Append-only per-order verification timeline. Each row is one milestone in the payment journey.';
COMMENT ON COLUMN order_timeline.occurred_at IS 'Set explicitly by the caller. Android events use the real bank SMS timestamp, not webhook arrival time.';
COMMENT ON COLUMN order_timeline.label IS 'Human-readable milestone label, e.g. "SMS Received", "Amount Verified".';
COMMENT ON COLUMN order_timeline.meta IS 'Step-specific metadata, e.g. { utr, amount, deviceId, ruleId }.';

-- Indexes
CREATE INDEX idx_order_timeline_order_time
  ON order_timeline (order_id, occurred_at ASC);

CREATE INDEX idx_order_timeline_event
  ON order_timeline (event);

-- Enable RLS
ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;

-- Admins and Support can read timelines
CREATE POLICY "order_timeline_admin_read" ON order_timeline
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = TRUE
        AND role IN ('SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'FINANCE')
    )
  );

-- NO UPDATE policy
-- NO DELETE policy
-- INSERT only via service role (from API routes)

COMMENT ON POLICY "order_timeline_admin_read" ON order_timeline
  IS 'Support role and above can read timelines. No UPDATE or DELETE policies exist — append-only by design.';
