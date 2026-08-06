import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const auth = await requireAdminRole('READ_ONLY');
  if (!auth.ok) return auth.response;

  const { orderId } = await params;
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers(id, name, email, phone),
      transactions(id, utr, amount, source, status, created_at),
      invoices(id, invoice_number, pdf_url, generated_at)
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: order });
}
