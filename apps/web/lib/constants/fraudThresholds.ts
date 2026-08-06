export const FRAUD_THRESHOLDS = {
  /** Max single transaction amount before HIGH flag (₹1 lakh) */
  UNUSUAL_AMOUNT_THRESHOLD: 100_000,

  /** Max SMS events from same device in 10 seconds before CRITICAL flag */
  MAX_EVENTS_PER_DEVICE_PER_10S: 5,

  /** Time window (seconds) for time window check */
  TIME_WINDOW_SECONDS: 300,

  /** Max duplicate UTR lookback days */
  DUPLICATE_UTR_LOOKBACK_DAYS: 30,
} as const;

export const FRAUD_RULES = {
  UNUSUAL_AMOUNT: 'UNUSUAL_AMOUNT',
  RAPID_FIRE: 'RAPID_FIRE',
  DUPLICATE_UTR: 'DUPLICATE_UTR',
  ORPHAN_PAYMENT: 'ORPHAN_PAYMENT',
  EXPIRED_ORDER: 'EXPIRED_ORDER',
} as const;
