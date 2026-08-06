export const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', scheme: 'tez://upi/', emoji: '💵' },
  { id: 'phonepe', name: 'PhonePe', scheme: 'phonepe://pay?', emoji: '💳' },
  { id: 'paytm', name: 'Paytm', scheme: 'paytmmp://pay?', emoji: '🏞️' },
  { id: 'bhim', name: 'BHIM', scheme: 'upi://pay?', emoji: '🌟' },
] as const;

export const UPI_PARAMS = {
  CURRENCY: 'INR',
  VERSION: '1.0',
} as const;
