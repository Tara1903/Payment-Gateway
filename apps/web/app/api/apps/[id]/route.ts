import { NextRequest, NextResponse } from 'next/server';
import { getClientAppById, saveClientApp } from '@/lib/apps/manager';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const UpdateAppSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  ownerName: z.string().optional(),
  ownerEmail: z.string().email().optional(),
  webhookUrl: z.string().url().or(z.literal('')).optional(),
  returnUrl: z.string().url().or(z.literal('')).optional(),
  description: z.string().optional(),

  // Bank Account Setup
  upiId: z.string().min(3).optional(),
  accountHolderName: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  bankIfsc: z.string().optional(),
  usePlatformBank: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const app = await getClientAppById(id);
  if (!app) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'App not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: app });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await getClientAppById(id);
  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'App not found' } },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const parsed = UpdateAppSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
        { status: 400 }
      );
    }

    const updated = await saveClientApp({
      ...existing,
      ...parsed.data,
      id: existing.id,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_FAILED', message: String(error) } },
      { status: 500 }
    );
  }
}
