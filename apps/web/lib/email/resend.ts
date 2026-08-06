import { Resend } from 'resend';
import { appendAuditLog } from '@/lib/audit/logger';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@ayurdhara.in';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  orderId?: string;
  tag?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ id: string } | null> {
  const { to, subject, html, orderId, tag } = options;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      tags: tag ? [{ name: 'type', value: tag }] : undefined,
    });

    if (error || !data) {
      console.error('[Resend] Send failed:', error);
      await logNotification({ to, subject, status: 'FAILED', orderId });
      return null;
    }

    await logNotification({ to, subject, status: 'SENT', orderId, resendId: data.id });
    return data;
  } catch (err) {
    console.error('[Resend] Unexpected error:', err);
    await logNotification({ to, subject, status: 'FAILED', orderId });
    return null;
  }
}

async function logNotification({
  to,
  subject,
  status,
  orderId,
  resendId,
}: {
  to: string | string[];
  subject: string;
  status: 'SENT' | 'FAILED';
  orderId?: string;
  resendId?: string;
}) {
  try {
    const { createAdminClient } = await import('@/lib/supabase/server');
    const supabase = createAdminClient();
    await supabase.from('notifications').insert({
      order_id: orderId ?? null,
      channel: 'EMAIL',
      recipient: Array.isArray(to) ? to.join(', ') : to,
      subject,
      status,
      attempts: 1,
      sent_at: status === 'SENT' ? new Date().toISOString() : null,
    });
  } catch (e) {
    // Non-critical — don't throw
    console.warn('[Resend] Failed to log notification:', e);
  }
}
