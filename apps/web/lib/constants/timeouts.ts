/** Order payment window in milliseconds (30 minutes) */
export const ORDER_EXPIRY_MS = 30 * 60 * 1000;

/** Show warning color on timer when < 2 minutes remain */
export const TIMER_WARNING_MS = 2 * 60 * 1000;

/** Show danger color on timer when < 1 minute remains */
export const TIMER_DANGER_MS = 60 * 1000;

/** Polling interval for order status on checkout page */
export const STATUS_POLL_INTERVAL_MS = 3000;

/** Android device heartbeat interval */
export const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

/** Time before triggering auto-fallback on checkout page (10 minutes) */
export const AUTO_FALLBACK_MS = 10 * 60 * 1000;
