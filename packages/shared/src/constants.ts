export const MERCHANT = {
  /** Used as prefix for order references */
  ORDER_REF_PREFIX: 'AYU',
  /** UPI ID of the merchant */
  UPI_ID: process.env['MERCHANT_UPI_ID'] ?? 'ayurdhara@upi',
  /** Display name */
  NAME: 'Ayurdhara',
} as const;

export const ORDER_TIMEOUTS = {
  /** Order expires after 30 minutes (in milliseconds) */
  EXPIRY_MS: 30 * 60 * 1000,
  /** QR code shows warning when < 2 minutes remain */
  WARNING_MS: 2 * 60 * 1000,
  /** QR code shows danger when < 1 minute remains */
  DANGER_MS: 60 * 1000,
} as const;

export const VERIFICATION = {
  /** Max allowed clock drift between SMS timestamp and server time (seconds) */
  MAX_CLOCK_DRIFT_SECONDS: 300,
  /** Pre-order payment window (seconds) */
  PRE_ORDER_WINDOW_SECONDS: 60,
} as const;
