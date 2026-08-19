import crypto from 'crypto';

export async function sendOrderWebhook(orderId: string, webhookUrl: string, payload: Record<string, unknown>) {
  try {
    const secret = process.env.INTERNAL_API_KEY;
    if (!secret) {
      console.warn('[Webhook] No INTERNAL_API_KEY set, sending unauthenticated webhook');
    }

    const body = JSON.stringify({
      event: 'payment.success',
      orderId,
      data: payload,
      timestamp: new Date().toISOString(),
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (secret) {
      // Create HMAC signature using the same internal API key
      const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');
      headers['X-Signature'] = signature;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      console.error(`[Webhook] Failed to send webhook to ${webhookUrl}: ${response.status} ${response.statusText}`);
    } else {
      console.log(`[Webhook] Successfully sent webhook to ${webhookUrl}`);
    }
  } catch (error) {
    console.error(`[Webhook] Error sending webhook to ${webhookUrl}:`, error);
  }
}
