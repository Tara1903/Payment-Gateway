export type TxnSource =
  | 'ANDROID_SMS'
  | 'ANDROID_NOTIFICATION'
  | 'MANUAL_UTR'
  | 'MANUAL_SCREENSHOT'
  | 'ADMIN';

export type TxnStatus =
  | 'RECEIVED'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'DUPLICATE'
  | 'FRAUD_HOLD';

export interface Transaction {
  id: string;
  orderId: string | null;
  merchantId: string;
  utr: string | null;
  amount: number;
  senderName: string | null;
  senderUpi: string | null;
  bankRef: string | null;
  paymentMode: string;
  source: TxnSource;
  rawPayload: Record<string, unknown> | null;
  status: TxnStatus;
  verifiedAt: string | null;
  createdAt: string;
}
