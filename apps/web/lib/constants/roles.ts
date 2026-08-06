import type { AdminRole } from '@starpay/types';

/**
 * Role hierarchy — higher index = more privileged
 */
export const ROLE_HIERARCHY: AdminRole[] = [
  'READ_ONLY',
  'FINANCE',
  'SUPPORT',
  'ADMIN',
  'SUPER_ADMIN',
];

export function isRoleAtLeast(userRole: AdminRole, minRole: AdminRole): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(minRole);
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  SUPPORT: 'Support',
  FINANCE: 'Finance',
  READ_ONLY: 'Read Only',
};

export const ROLE_COLORS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'rgb(248 113 113)',
  ADMIN: 'rgb(139 92 246)',
  SUPPORT: 'rgb(52 211 153)',
  FINANCE: 'rgb(96 165 250)',
  READ_ONLY: 'rgb(100 116 139)',
};
