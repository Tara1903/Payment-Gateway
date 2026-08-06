import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyOrderToken } from '@/lib/crypto/token';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const token = request.headers.get('X-Payment-Token') ??
    request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Payment token required' } },
      { status: 401 }
    );
  }

  const payload = await verifyOrderToken(token);
  if (!payload || payload.orderId !== orderId) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token' } },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, html_url, generated_at')
    .eq('order_id', orderId)
    .single();

  if (error || !invoice) {
    // Try to generate on-demand
    const { generateInvoice } = await import('@/lib/invoice/generator');
    const generated = await generateInvoice(orderId);
    if (!generated) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not available' } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: generated });
  }

  return NextResponse.json({ success: true, data: invoice });
}
