import { createHmac, timingSafeEqual } from 'crypto';

const MAX_TIMESTAMP_DRIFT_SECONDS = 300; // 5 minutes

interface VerifyOptions {
  timestamp: string;
  signature: string;
  rawBody: string;
  secret: string;
}

interface VerifyResult {
  valid: boolean;
  reason?: string;
}

export function verifyWebhookSignature({ timestamp, signature, rawBody, secret }: VerifyOptions): VerifyResult {
  // 1. Check timestamp freshness
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) {
    return { valid: false, reason: 'Invalid timestamp format' };
  }

  const driftSeconds = Math.abs((Date.now() - ts) / 1000);
  if (driftSeconds > MAX_TIMESTAMP_DRIFT_SECONDS) {
    return { valid: false, reason: `Timestamp too old (drift: ${Math.round(driftSeconds)}s)` };
  }

  // 2. Compute expected HMAC
  const payload = `${timestamp}.${rawBody}`;
  const expected = createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  // 3. Timing-safe comparison
  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');

  if (sigBuf.length !== expBuf.length) {
    return { valid: false, reason: 'Signature length mismatch' };
  }

  const match = timingSafeEqual(sigBuf, expBuf);
  return match ? { valid: true } : { valid: false, reason: 'Signature mismatch' };
}

export function generateWebhookSignature(timestamp: string, body: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`${timestamp}.${body}`, 'utf8')
    .digest('hex');
}
