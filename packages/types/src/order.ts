export type OrderStatus =
  | 'CREATED'
  | 'AWAITING_PAYMENT'
  | 'VERIFYING'
  | 'PAID'
  | 'PENDING_VERIFICATION'
  | 'FAILED'
  | 'REFUNDED';

export interface Order {
  id: string;
  merchantId: string;
  customerId: string | null;
  orderRef: string;
  amount: number;
  reservedAmount: number;
  currency: string;
  description: string | null;
  status: OrderStatus;
  paymentToken: string;
  upiTxnRef: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  metadata: Record<string, unknown>;
  returnUrl: string | null;
  webhookUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  amount: number;
  currency?: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, unknown>;
  returnUrl?: string;
  webhookUrl?: string;
}

export interface OrderWithCustomer extends Order {
  customer: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

export interface OrderStatusResponse {
  orderId: string;
  status: OrderStatus;
  paidAt: string | null;
  amount: number;
  reservedAmount: number;
}
