import type { InvoiceData } from '@starpay/types';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Generate a unique invoice number.
 * Format: INV-YYYYMMDD-XXXX
 */
function generateInvoiceNumber(sequence: number): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `INV-${date}-${sequence.toString().padStart(4, '0')}`;
}

/**
 * Render invoice as HTML string.
 */
function renderInvoiceHtml(data: InvoiceData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #020617; color: #F8FAFC; padding: 40px; }
    .container { max-width: 700px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg,#7C3AED,#5B21B6); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .logo-text { font-size: 20px; font-weight: 700; }
    .invoice-number { text-align: right; }
    .invoice-number .label { color: #475569; font-size: 12px; }
    .invoice-number .value { font-family: monospace; font-size: 18px; font-weight: 600; color: #A78BFA; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0; }
    .section { background: #0D1125; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .section-title { font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
    .row .label { color: #94A3B8; font-size: 14px; }
    .row .value { color: #F8FAFC; font-size: 14px; font-weight: 500; font-family: monospace; }
    .amount-row { padding: 16px 0; }
    .amount-row .label { color: #64748B; font-size: 14px; }
    .amount-row .value { color: #F8FAFC; font-size: 28px; font-weight: 700; }
    .status-badge { display: inline-block; background: rgba(52,211,153,0.1); color: #34D399; border: 1px solid rgba(52,211,153,0.3); border-radius: 9999px; padding: 4px 12px; font-size: 12px; font-weight: 600; }
    .footer { text-align: center; color: #334155; font-size: 12px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">⚡</div>
        <div>
          <div class="logo-text">${data.merchantName}</div>
          <div style="color:#475569;font-size:12px;">UPI: ${data.merchantUpiId}</div>
        </div>
      </div>
      <div class="invoice-number">
        <div class="label">INVOICE</div>
        <div class="value">${data.invoiceNumber}</div>
        <div style="color:#475569;font-size:12px;margin-top:4px;">${new Date(data.orderDate).toLocaleDateString('en-IN')}</div>
      </div>
    </div>

    <div class="section">
      <p class="section-title">Payment Summary</p>
      <div class="row amount-row">
        <span class="label">Total Amount Paid</span>
        <span class="value">₹${data.amount.toFixed(2)}</span>
      </div>
      <span class="status-badge">✔ Verified & Paid</span>
    </div>

    <div class="section">
      <p class="section-title">Order Details</p>
      <div class="row">
        <span class="label">Order Reference</span>
        <span class="value">${data.orderRef}</span>
      </div>
      <hr class="divider">
      <div class="row">
        <span class="label">Description</span>
        <span class="value">${data.description ?? 'Payment'}</span>
      </div>
      <hr class="divider">
      <div class="row">
        <span class="label">UTR Number</span>
        <span class="value">${data.utr ?? '—'}</span>
      </div>
      <hr class="divider">
      <div class="row">
        <span class="label">Paid At</span>
        <span class="value">${new Date(data.paidAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
      </div>
    </div>

    ${data.customerName || data.customerEmail ? `
    <div class="section">
      <p class="section-title">Customer</p>
      ${data.customerName ? `<div class="row"><span class="label">Name</span><span class="value">${data.customerName}</span></div>` : ''}
      ${data.customerEmail ? `<div class="row"><span class="label">Email</span><span class="value">${data.customerEmail}</span></div>` : ''}
    </div>
    ` : ''}

    <div class="footer">
      <p>This is a digitally generated invoice. No signature required.</p>
      <p style="margin-top:8px;">Powered by StarPay • ${data.merchantName} • ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>`;
}

export interface GenerateInvoiceResult {
  invoiceId: string;
  invoiceNumber: string;
  htmlUrl: string | null;
}

export async function generateInvoice(orderId: string): Promise<GenerateInvoiceResult | null> {
  const supabase = createAdminClient();

  // 1. Fetch order + customer + transaction
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select(`
      id, order_ref, amount, currency, description, paid_at, created_at,
      customers(name, email),
      transactions(utr),
      merchants(name, upi_id)
    `)
    .eq('id', orderId)
    .single();

  if (orderErr || !order || order.paid_at === null) {
    console.error('[Invoice] Order not found or not paid:', orderErr);
    return null;
  }

  // Check if invoice already exists
  const { data: existing } = await supabase
    .from('invoices')
    .select('id, invoice_number, html_url')
    .eq('order_id', orderId)
    .single();

  if (existing) {
    return { invoiceId: existing.id, invoiceNumber: existing.invoice_number, htmlUrl: existing.html_url };
  }

  // 2. Get sequence for invoice number
  const { data: seqData } = await supabase.rpc('next_order_sequence');
  const sequence = Number(seqData ?? 1);
  const invoiceNumber = generateInvoiceNumber(sequence);

  const merchant = order.merchants as unknown as { name: string; upi_id: string } | null;
  const customer = order.customers as unknown as { name: string | null; email: string | null } | null;
  const transaction = Array.isArray(order.transactions) ? order.transactions[0] as { utr: string | null } | undefined : null;

  const invoiceData: InvoiceData = {
    invoiceNumber,
    orderRef: order.order_ref,
    orderDate: order.created_at,
    paidAt: order.paid_at,
    merchantName: merchant?.name ?? 'Ayurdhara',
    merchantUpiId: merchant?.upi_id ?? process.env.MERCHANT_UPI_ID ?? 'ayurdhara@upi',
    customerName: customer?.name ?? null,
    customerEmail: customer?.email ?? null,
    description: order.description,
    amount: Number(order.amount),
    currency: order.currency,
    utr: transaction?.utr ?? null,
  };

  // 3. Render HTML
  const htmlContent = renderInvoiceHtml(invoiceData);

  // 4. Upload HTML to Supabase Storage
  let htmlUrl: string | null = null;
  try {
    const fileName = `invoices/${orderId}/${invoiceNumber}.html`;
    const { error: uploadErr } = await supabase.storage
      .from('starpay-documents')
      .upload(fileName, htmlContent, { contentType: 'text/html', upsert: true });

    if (!uploadErr) {
      const { data: urlData } = supabase.storage.from('starpay-documents').getPublicUrl(fileName);
      htmlUrl = urlData?.publicUrl ?? null;
    }
  } catch (e) {
    console.warn('[Invoice] Storage upload failed:', e);
  }

  // 5. Insert invoice record
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .insert({
      order_id: orderId,
      invoice_number: invoiceNumber,
      html_url: htmlUrl,
    })
    .select('id')
    .single();

  if (invErr || !invoice) {
    console.error('[Invoice] Insert failed:', invErr);
    return null;
  }

  return { invoiceId: invoice.id, invoiceNumber, htmlUrl };
}
