import type { ParsedPayment } from '@starpay/types';
import { createAdminClient } from '@/lib/supabase/server';

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

export async function checkUtrUniqueness(input: StepInput): Promise<StepResult> {
  const { parsed, transactionId } = input;
  const supabase = createAdminClient();

  // Check if this UTR exists in any OTHER transaction (not the current one)
  const { data: existing } = await supabase
    .from('transactions')
    .select('id, status')
    .eq('utr', parsed.utr)
    .neq('id', transactionId)
    .limit(1);

  if (existing && existing.length > 0) {
    const dup = existing[0]!;
    // Mark current transaction as duplicate
    await supabase
      .from('transactions')
      .update({ status: 'DUPLICATE' })
      .eq('id', transactionId);

    return {
      result: 'FAIL',
      reason: `Duplicate UTR detected: ${parsed.utr} already exists in transaction ${dup.id}`,
      meta: { utr: parsed.utr, duplicateOf: dup.id, duplicateStatus: dup.status },
    };
  }

  return {
    result: 'PASS',
    reason: `UTR ${parsed.utr} is unique`,
    meta: { utr: parsed.utr },
  };
}
