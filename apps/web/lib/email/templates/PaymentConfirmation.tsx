import type { InvoiceData } from '@starpay/types';

interface Props {
  data: InvoiceData;
}

export function PaymentConfirmationEmail({ data }: Props) {
  const styles = {
    body: 'margin:0;padding:0;background:#020617;font-family:Inter,Arial,sans-serif;',
    container: 'max-width:600px;margin:0 auto;padding:40px 20px;',
    header: 'text-align:center;margin-bottom:32px;',
    logo: 'display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:linear-gradient(135deg,#7C3AED,#6D28D9);border-radius:12px;margin-bottom:16px;font-size:24px;',
    title: 'color:#F8FAFC;font-size:24px;font-weight:700;margin:0 0 8px;',
    subtitle: 'color:#94A3B8;font-size:14px;margin:0;',
    successBadge: 'display:inline-block;background:rgba(52,211,153,0.1);color:#34D399;border:1px solid rgba(52,211,153,0.3);border-radius:9999px;padding:6px 16px;font-size:13px;font-weight:600;margin-bottom:24px;',
    card: 'background:#0D1125;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin-bottom:16px;',
    amountBig: 'color:#F8FAFC;font-size:36px;font-weight:700;font-family:monospace;text-align:center;margin:0 0 4px;',
    label: 'color:#475569;font-size:12px;',
    value: 'color:#F8FAFC;font-size:14px;font-weight:500;',
    divider: 'border:none;border-top:1px solid rgba(255,255,255,0.06);margin:16px 0;',
    footer: 'text-align:center;color:#334155;font-size:12px;margin-top:32px;',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Payment Confirmed — ${data.merchantName}</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.header}">
      <div style="${styles.logo}">⚡</div>
      <h1 style="${styles.title}">${data.merchantName}</h1>
      <p style="${styles.subtitle}">Payment Receipt</p>
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <span style="${styles.successBadge}">✔ Payment Successful</span>
    </div>

    <div style="${styles.card}">
      <p style="${styles.amountBig}">₹${data.amount.toFixed(2)}</p>
      <p style="text-align:center;${styles.label}">${data.currency}</p>
    </div>

    <div style="${styles.card}">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;${styles.label}">Invoice Number</td>
          <td style="padding:8px 0;${styles.value};text-align:right;font-family:monospace;">${data.invoiceNumber}</td>
        </tr>
        <hr style="${styles.divider}">
        <tr>
          <td style="padding:8px 0;${styles.label}">Order Reference</td>
          <td style="padding:8px 0;${styles.value};text-align:right;font-family:monospace;">${data.orderRef}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;${styles.label}">Description</td>
          <td style="padding:8px 0;${styles.value};text-align:right;">${data.description ?? 'Payment'}</td>
        </tr>
        <hr style="${styles.divider}">
        <tr>
          <td style="padding:8px 0;${styles.label}">UTR Reference</td>
          <td style="padding:8px 0;${styles.value};text-align:right;font-family:monospace;">${data.utr ?? '—'}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;${styles.label}">Paid At</td>
          <td style="padding:8px 0;${styles.value};text-align:right;">${new Date(data.paidAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
        </tr>
        <hr style="${styles.divider}">
        <tr>
          <td style="padding:8px 0;${styles.label}">Merchant UPI</td>
          <td style="padding:8px 0;${styles.value};text-align:right;font-family:monospace;">${data.merchantUpiId}</td>
        </tr>
      </table>
    </div>

    <div style="${styles.footer}">
      <p>This is an automated receipt from ${data.merchantName}.</p>
      <p style="margin-top:8px;">Powered by StarPay • Secured • Verified</p>
    </div>
  </div>
</body>
</html>
`;
}
