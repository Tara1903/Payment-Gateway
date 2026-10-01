import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/rbac/guard';

export async function GET() {
  const auth = await requireAdminRole('READ_ONLY');
  if (!auth.ok) return auth.response;

  const key = process.env.STARPAY_INTERNAL_API_KEY;
  if (!key) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_CONFIGURED', message: 'API key not configured in environment' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, key });
}
