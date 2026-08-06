import type { ParsedPayment } from '@starpay/types';
import { createAdminClient } from '@/lib/supabase/server';
import { FRAUD_THRESHOLDS, FRAUD_RULES } from '@/lib/constants/fraudThresholds';

interface StepInput {
  order: { reserved_amount: number; amount: number; expires_at: string | null };
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

export async function checkFraudRules(input: StepInput): Promise<StepResult> {
  const { parsed, deviceId, merchantId, transactionId } = input;
  const supabase = createAdminClient();
  const flagsToInsert: Array<{
    transaction_id: string;
    rule_triggered: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    details: Record<string, unknown>;
  }> = [];

  // Rule 1: Unusual amount (over ₹1 lakh)
  if (parsed.amount > FRAUD_THRESHOLDS.UNUSUAL_AMOUNT_THRESHOLD) {
    flagsToInsert.push({
      transaction_id: transactionId,
      rule_triggered: FRAUD_RULES.UNUSUAL_AMOUNT,
      severity: 'HIGH',
      details: { amount: parsed.amount, threshold: FRAUD_THRESHOLDS.UNUSUAL_AMOUNT_THRESHOLD },
    });
  }

  // Rule 2: Rapid fire — more than 3 events from same device in 10 seconds
  const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
  const { count: rapidCount } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId)
    .gte('created_at', tenSecondsAgo);

  if ((rapidCount ?? 0) > FRAUD_THRESHOLDS.MAX_EVENTS_PER_DEVICE_PER_10S) {
    flagsToInsert.push({
      transaction_id: transactionId,
      rule_triggered: FRAUD_RULES.RAPID_FIRE,
      severity: 'CRITICAL',
      details: { count: rapidCount, window: '10s', deviceId },
    });
  }

  // Insert all flags
  if (flagsToInsert.length > 0) {
    await supabase.from('fraud_flags').insert(flagsToInsert);

    const critical = flagsToInsert.find((f) => f.severity === 'CRITICAL');
    if (critical) {
      return {
        result: 'FAIL',
        reason: `CRITICAL fraud rule triggered: ${critical.rule_triggered}`,
        meta: { rules: flagsToInsert.map((f) => f.rule_triggered), details: critical.details },
      };
    }
  }

  return {
    result: 'PASS',
    reason: 'No fraud rules triggered',
    meta: { flagsRaised: flagsToInsert.length },
  };
}
