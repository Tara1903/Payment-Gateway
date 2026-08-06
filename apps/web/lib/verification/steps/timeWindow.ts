import type { ParsedPayment } from '@starpay/types';

const MAX_CLOCK_DRIFT_SECONDS = 300; // 5 minutes — allow for SMS delivery delay
const PRE_ORDER_WINDOW_SECONDS = 60;  // Payment can't be more than 1 min before order

interface StepInput {
  order: { reserved_amount: number; expires_at: string | null; amount: number };
  parsed: ParsedPayment;
  deviceId: string;
  merchantId: string;
  transactionId: string;
}

interface StepResult {
  result: 'PASS' | 'FAIL' | 'SKIP';
  reason?: string;
  meta?: Record<string, unknown>;
}

export async function checkTimeWindow(input: StepInput): Promise<StepResult> {
  const { order, parsed } = input;

  if (!order.expires_at) {
    // No expiry set — skip this check
    return { result: 'SKIP', reason: 'No expiry set on order' };
  }

  const txnTime = new Date(parsed.txnTimestamp).getTime();
  const expiresAt = new Date(order.expires_at).getTime();
  const now = Date.now();

  // Check 1: Payment must not be after expiry + drift allowance
  if (txnTime > expiresAt + MAX_CLOCK_DRIFT_SECONDS * 1000) {
    return {
      result: 'FAIL',
      reason: `Payment timestamp (${parsed.txnTimestamp}) is after order expiry (${order.expires_at})`,
      meta: { txnTime: parsed.txnTimestamp, expiresAt: order.expires_at },
    };
  }

  // Check 2: Order must not be expired when we're processing
  if (now > expiresAt + MAX_CLOCK_DRIFT_SECONDS * 1000) {
    return {
      result: 'FAIL',
      reason: `Order has expired`,
      meta: { expiresAt: order.expires_at, now: new Date(now).toISOString() },
    };
  }

  return {
    result: 'PASS',
    reason: `Payment within valid time window`,
    meta: { txnTimestamp: parsed.txnTimestamp, expiresAt: order.expires_at },
  };
}
