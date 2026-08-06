export type VerificationPipelineStep =
  | 'AMOUNT_MATCH'
  | 'TIME_WINDOW'
  | 'UTR_UNIQUENESS'
  | 'FRAUD_RULES'
  | 'ORDER_LOOKUP'
  | 'ORDER_STATUS';

export type VerificationResult = 'PASS' | 'FAIL' | 'SKIP';

export interface VerificationEvent {
  id: string;
  orderId: string | null;
  transactionId: string | null;
  pipelineStep: VerificationPipelineStep;
  result: VerificationResult;
  reason: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface ManualVerification {
  id: string;
  orderId: string;
  submittedBy: string | null;
  utrEntered: string | null;
  screenshotUrl: string | null;
  notes: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export type FraudSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FraudFlag {
  id: string;
  orderId: string | null;
  transactionId: string | null;
  ruleTriggered: string;
  severity: FraudSeverity;
  details: Record<string, unknown> | null;
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface PipelineContext {
  rawPayload: Record<string, unknown>;
  parsed: ParsedPayment;
  deviceId: string;
  source: import('./transaction').TxnSource;
  arrivedAt: string;
}

export interface ParsedPayment {
  amount: number;
  utr: string;
  senderName: string | null;
  senderUpi: string | null;
  bankRef: string | null;
  txnTimestamp: string;
}

export type PipelineStepFn = (
  ctx: PipelineContext
) => Promise<PipelineStepResult>;

export interface PipelineStepResult {
  result: VerificationResult;
  reason?: string;
  meta?: Record<string, unknown>;
  stopPipeline?: boolean;
}
