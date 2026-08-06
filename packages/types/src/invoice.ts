export interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  htmlUrl: string | null;
  pdfUrl: string | null;
  generatedAt: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderRef: string;
  orderDate: string;
  paidAt: string;
  merchantName: string;
  merchantUpiId: string;
  customerName: string | null;
  customerEmail: string | null;
  description: string | null;
  amount: number;
  currency: string;
  utr: string | null;
}
