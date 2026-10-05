import { NextRequest, NextResponse } from 'next/server';
import { listClientApps, saveClientApp } from '@/lib/apps/manager';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateAppSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().optional(),
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
});

export async function GET() {
  try {
    const apps = await listClientApps();
    return NextResponse.json({ success: true, data: apps });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_FAILED', message: String(error) } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateAppSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
        { status: 400 }
      );
    }

    const app = await saveClientApp(parsed.data);
    return NextResponse.json({ success: true, data: app });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'SAVE_FAILED', message: String(error) } },
      { status: 500 }
    );
  }
}
