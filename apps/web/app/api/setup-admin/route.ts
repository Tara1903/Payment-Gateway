import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();

    const email = 'admin@starpay.com';
    const password = 'Tara@1903';
    let userId = '2dcbb1f0-d266-44db-9c58-0eb61010fcec';

    // 1. List users to see if admin@starpay.com already exists
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json({
        success: false,
        step: 'listUsers',
        error: listError.message,
      }, { status: 500 });
    }

    const existingUser = usersData?.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      userId = existingUser.id;
      // Update password & confirm email
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: { name: 'Admin' },
      });

      if (updateError) {
        return NextResponse.json({
          success: false,
          step: 'updateUserById',
          error: updateError.message,
        }, { status: 500 });
      }
    } else {
      // Create user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        id: userId,
        email,
        password,
        email_confirm: true,
        user_metadata: { name: 'Admin' },
      });

      if (createError) {
        return NextResponse.json({
          success: false,
          step: 'createUser',
          error: createError.message,
        }, { status: 500 });
      }

      if (newUser?.user) {
        userId = newUser.user.id;
      }
    }

    // 2. Insert / Upsert into admin_users table via Service Role (bypasses RLS)
    const { data: adminRecord, error: adminError } = await supabase
      .from('admin_users')
      .upsert({
        id: userId,
        name: 'Admin',
        email,
        role: 'SUPER_ADMIN',
        is_active: true,
      }, { onConflict: 'id' })
      .select()
      .single();

    if (adminError) {
      return NextResponse.json({
        success: false,
        step: 'upsert_admin_users',
        error: adminError.message,
        details: adminError,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account successfully configured and active!',
      user: {
        id: userId,
        email,
        role: 'SUPER_ADMIN',
        adminRecord,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message ?? String(err),
    }, { status: 500 });
  }
}
