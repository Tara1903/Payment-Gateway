import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { createAdminClient } from '@/lib/supabase/server';
import { PaginationSchema } from '@starpay/shared';

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole('READ_ONLY');
  if (!auth.ok) return auth.response;

  const url = request.nextUrl;
  const pagination = PaginationSchema.safeParse({
    page: url.searchParams.get('page'),
    limit: url.searchParams.get('limit'),
    order: url.searchParams.get('order'),
  });

  const page = pagination.success ? pagination.data.page : 1;
  const limit = pagination.success ? pagination.data.limit : 25;
  const order = pagination.success ? pagination.data.order : 'desc';
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createAdminClient();
  let query = supabase
    .from('orders')
    .select('id, order_ref, amount, reserved_amount, currency, description, status, paid_at, created_at, customers(name, email)', { count: 'exact' })
    .order('created_at', { ascending: order === 'asc' })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (search) query = query.or(`order_ref.ilike.%${search}%`);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      items: data ?? [],
      total: count ?? 0,
      page,
      limit,
      hasMore: (count ?? 0) > to + 1,
    },
  });
}
