import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { AdminRole } from '@starpay/types';
import { ROLE_HIERARCHY } from '@/lib/constants/roles';

type AuthSuccess = { ok: true; userId: string; role: AdminRole };
type AuthFailure = { ok: false; response: NextResponse };
type AuthResult = AuthSuccess | AuthFailure;

export async function requireAdminRole(minRole: AdminRole): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  if (userErr || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      ),
    };
  }

  const adminSupabase = createAdminClient();
  const { data: adminUser, error: adminErr } = await adminSupabase
    .from('admin_users')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (adminErr || !adminUser || !adminUser.is_active) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Not an active admin user' } },
        { status: 403 }
      ),
    };
  }

  const userRoleIndex = ROLE_HIERARCHY.indexOf(adminUser.role as AdminRole);
  const minRoleIndex = ROLE_HIERARCHY.indexOf(minRole);

  if (userRoleIndex < minRoleIndex) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: `Requires ${minRole} role or higher` } },
        { status: 403 }
      ),
    };
  }

  return { ok: true, userId: user.id, role: adminUser.role as AdminRole };
}
