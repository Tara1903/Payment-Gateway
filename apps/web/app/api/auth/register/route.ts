import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { saveClientApp } from '@/lib/apps/manager';
import { appendAuditLog } from '@/lib/audit/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  businessName: z.string().min(2, 'Business or App name must be at least 2 characters').max(100),
  
  // Optional Settlement Bank Details with defaults
  upiId: z.string().min(3).optional().default('9630937033@sbi'),
  accountHolderName: z.string().optional(),
  bankName: z.string().optional().default('State Bank of India'),
  accountNumber: z.string().optional().default('2441'),
  bankIfsc: z.string().optional().default('SBIN0002441'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: firstIssue?.message || 'Invalid registration data',
          },
        },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      password,
      businessName,
      upiId,
      accountHolderName,
      bankName,
      accountNumber,
      bankIfsc,
    } = parsed.data;

    const normalizedEmail = email.trim().toLowerCase();
    const adminClient = createAdminClient();

    // 1. Check if user already exists in admin_users
    const { data: existingUser } = await adminClient
      .from('admin_users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'An account with this email already exists. Please sign in.',
          },
        },
        { status: 409 }
      );
    }

    // 2. Create user in Supabase Auth via Admin API
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: fullName,
        business_name: businessName,
      },
    });

    if (authError || !authData?.user) {
      const isAlreadyRegistered =
        authError?.message?.toLowerCase().includes('already') ||
        authError?.message?.toLowerCase().includes('exists');

      return NextResponse.json(
        {
          success: false,
          error: {
            code: isAlreadyRegistered ? 'USER_EXISTS' : 'AUTH_CREATE_FAILED',
            message: isAlreadyRegistered
              ? 'An account with this email already exists. Please sign in.'
              : authError?.message || 'Failed to create user account',
          },
        },
        { status: isAlreadyRegistered ? 409 : 400 }
      );
    }

    const userId = authData.user.id;

    // 3. Create record in admin_users table with role 'ADMIN'
    const { error: profileError } = await adminClient
      .from('admin_users')
      .insert({
        id: userId,
        name: fullName,
        email: normalizedEmail,
        role: 'ADMIN',
        is_active: true,
      });

    if (profileError) {
      console.error('[Register] Failed to create admin_user profile:', profileError);
    }

    // 4. Automatically provision initial Client App for the merchant
    const initialApp = await saveClientApp({
      name: businessName,
      ownerName: fullName,
      ownerEmail: normalizedEmail,
      description: `${businessName} Payments App`,
      upiId: upiId || '9630937033@sbi',
      accountHolderName: accountHolderName || fullName || 'Hari Singh',
      bankName: bankName || 'State Bank of India',
      accountNumber: accountNumber || '2441',
      bankIfsc: bankIfsc || 'SBIN0002441',
      usePlatformBank: true,
      isActive: true,
    });

    // 5. Append audit log
    await appendAuditLog({
      actorType: 'ADMIN',
      actorId: userId,
      eventType: 'ADMIN_USER_CREATED',
      entityType: 'admin_users',
      entityId: userId,
      payload: {
        email: normalizedEmail,
        fullName,
        businessName,
        appId: initialApp.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userId,
          email: normalizedEmail,
          name: fullName,
        },
        app: initialApp,
      },
    });
  } catch (error) {
    console.error('[Register] Unexpected error during registration:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
