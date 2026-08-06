import type { ParsedPayment } from '@starpay/types';

interface StepInput {
  order: { amount: number; reserved_amount: number; expires_at: string | null };
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

export async function checkAmountMatch(input: StepInput): Promise<StepResult> {
  const { order, parsed } = input;
  const expected = Number(order.reserved_amount);
  const received = Number(parsed.amount);

  // Allow 0 paise tolerance (exact match required)
  if (Math.abs(expected - received) < 0.001) {
    return {
      result: 'PASS',
      reason: `Amount matches: ₹${received.toFixed(2)}`,
      meta: { expected, received },
    };
  }

  return {
    result: 'FAIL',
    reason: `Amount mismatch: expected ₹${expected.toFixed(2)}, received ₹${received.toFixed(2)}`,
    meta: { expected, received, diff: Math.abs(expected - received) },
  };
}
