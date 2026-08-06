import { sendEmail } from '@/lib/email/resend';
import { generateInvoice } from '@/lib/invoice/generator';
import { appendTimeline } from '@/lib/timeline/logger';
import { appendAuditLog } from '@/lib/audit/logger';
import { createAdminClient } from '@/lib/supabase/server';
import { PaymentConfirmationEmail } from '@/lib/email/templates/PaymentConfirmation';

export async function sendPaymentApprovedNotifications(orderId: string): Promise<void> {
  const supabase = createAdminClient();

  // Fetch full order details
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, order_ref, amount, currency, description, paid_at,
      customers(name, email),
      transactions(utr),
      merchants(name, upi_id)
    `)
    .eq('id', orderId)
    .single();

  if (!order || !order.paid_at) return;

  const customer = order.customers as unknown as { name: string | null; email: string | null } | null;
  const merchant = order.merchants as unknown as { name: string; upi_id: string } | null;
  const transaction = Array.isArray(order.transactions) ? order.transactions[0] as { utr: string | null } | undefined : null;

  // 1. Generate invoice
  const invoice = await generateInvoice(orderId).catch(() => null);

  if (invoice) {
    await appendTimeline({
      orderId,
      event: 'INVOICE_GENERATED',
      actorType: 'SYSTEM',
      label: 'Invoice Generated',
      description: `Invoice ${invoice.invoiceNumber} generated`,
      meta: { invoiceNumber: invoice.invoiceNumber, htmlUrl: invoice.htmlUrl },
    });
  }

  // 2. Send email if customer has an email
  if (customer?.email) {
    const html = PaymentConfirmationEmail({
      data: {
        invoiceNumber: invoice?.invoiceNumber ?? order.order_ref,
        orderRef: order.order_ref,
        orderDate: order.paid_at,
        paidAt: order.paid_at,
        merchantName: merchant?.name ?? 'Ayurdhara',
        merchantUpiId: merchant?.upi_id ?? 'ayurdhara@upi',
        customerName: customer.name,
        customerEmail: customer.email,
        description: order.description,
        amount: Number(order.amount),
        currency: order.currency,
        utr: transaction?.utr ?? null,
      },
    });

    const sent = await sendEmail({
      to: customer.email,
      subject: `Payment Confirmed \u2014 ${order.order_ref} \u20b9${Number(order.amount).toFixed(2)}`,
      html,
      orderId,
      tag: 'payment_confirmed',
    });

    await appendTimeline({
      orderId,
      event: 'NOTIFICATION_SENT',
      actorType: 'SYSTEM',
      label: 'Confirmation Email Sent',
      description: `Email sent to ${customer.email}`,
      meta: { email: customer.email, resendId: sent?.id ?? null },
    });
  }

  await appendAuditLog({
    actorType: 'SYSTEM',
    eventType: 'NOTIFICATIONS_SENT',
    entityType: 'order',
    entityId: orderId,
    payload: { invoiceGenerated: !!invoice, emailSent: !!customer?.email },
  });
}
