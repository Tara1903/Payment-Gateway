import type { AdminRole, Permission } from '@starpay/types';
import { ROLE_PERMISSIONS } from '@starpay/types';

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: AdminRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Role hierarchy for comparison.
 * Higher value = more privileged.
 */
export const ROLE_RANK: Record<AdminRole, number> = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  SUPPORT: 3,
  FINANCE: 2,
  READ_ONLY: 1,
};

/**
 * Check if a role meets a minimum role requirement.
 */
export function meetsMinimumRole(userRole: AdminRole, minimumRole: AdminRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minimumRole];
}

/**
 * Get a human-readable label for a role.
 */
export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  SUPPORT: 'Support',
  FINANCE: 'Finance',
  READ_ONLY: 'Read Only',
};

/**
 * Get the badge variant for a role.
 */
export const ROLE_BADGE_VARIANTS: Record<AdminRole, 'purple' | 'danger' | 'info' | 'success' | 'warning'> = {
  SUPER_ADMIN: 'purple',
  ADMIN: 'danger',
  SUPPORT: 'info',
  FINANCE: 'success',
  READ_ONLY: 'warning',
};
