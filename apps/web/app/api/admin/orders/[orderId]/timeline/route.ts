import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/rbac/guard';
import { getTimeline } from '@/lib/timeline/logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const auth = await requireAdminRole('SUPPORT');
  if (!auth.ok) return auth.response;

  const { orderId } = await params;
  const timeline = await getTimeline(orderId);

  return NextResponse.json({ success: true, data: timeline });
}
