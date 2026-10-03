import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const UpdateMerchantSchema = z.object({
  name: z.string().min(1).optional(),
  upi_id: z.string().min(1).optional(),
  bank_account: z.string().optional(),
  bank_ifsc: z.string().optional(),
});

async function verifyAdminOrApiKey(request: NextRequest, minimumRole: 'READ_ONLY' | 'SUPER_ADMIN') {
  const apiKey = request.headers.get('X-API-Key') ?? request.headers.get('authorization')?.replace('Bearer ', '');
  const validKey = process.env.STARPAY_INTERNAL_API_KEY || process.env.INTERNAL_API_KEY;
  if (apiKey && validKey && apiKey === validKey) {
    return { ok: true };
  }
  const auth = await requireAdminRole(minimumRole);
  if (!auth.ok) return { ok: false, response: auth.response };
  return { ok: true };
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminOrApiKey(request, 'READ_ONLY');
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('merchants')
    .select('id, name, upi_id, bank_account, bank_ifsc, is_active, created_at, updated_at')
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdminOrApiKey(request, 'SUPER_ADMIN');
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = UpdateMerchantSchema.parse(body);

    const supabase = createAdminClient();
    
    // Get the first merchant to update
    const { data: merchant, error: fetchError } = await supabase
      .from('merchants')
      .select('id')
      .limit(1)
      .single();

    if (fetchError || !merchant) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Merchant not found' } }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('merchants')
      .update({
        ...parsed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', merchant.id)
      .select('id, name, upi_id, bank_account, bank_ifsc, is_active, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } }, { status: 400 });
  }
}
