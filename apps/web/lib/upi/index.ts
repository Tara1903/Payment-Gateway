import QRCode from 'qrcode';

const MERCHANT_UPI_ID = process.env.MERCHANT_UPI_ID ?? 'ayurdhara@upi';
const MERCHANT_NAME = 'Ayurdhara';

/**
 * Build a UPI payment URL (used for QR + intent link)
 */
export function buildUpiUrl(params: {
  amount: number;
  txnRef: string;
  description: string;
  upiId?: string;
  merchantName?: string;
}): string {
  const pa = params.upiId ?? MERCHANT_UPI_ID;
  const pn = params.merchantName ?? MERCHANT_NAME;
  const am = params.amount.toFixed(2);
  const tr = params.txnRef;
  const tn = encodeURIComponent(params.description);

  return `upi://pay?pa=${pa}&pn=${encodeURIComponent(pn)}&am=${am}&tr=${tr}&tn=${tn}&cu=INR`;
}

/**
 * Generate a QR code as a base64 data URL (PNG)
 */
export async function generateQrCode(upiUrl: string): Promise<string> {
  return QRCode.toDataURL(upiUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 400,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

/**
 * Generate a unique UPI transaction reference.
 * Format: SP{timestamp6}{random4} — 12 chars total, alphanumeric
 */
export function generateUpiTxnRef(): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `SP${ts}${rand}`;
}
