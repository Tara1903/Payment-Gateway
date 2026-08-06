export type AdminRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SUPPORT'
  | 'FINANCE'
  | 'READ_ONLY';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Permission =
  | 'orders:read'
  | 'orders:write'
  | 'transactions:read'
  | 'manual_verifications:read'
  | 'manual_verifications:approve'
  | 'fraud_flags:read'
  | 'fraud_flags:resolve'
  | 'audit_logs:read'
  | 'invoices:read'
  | 'android_devices:read'
  | 'admin_users:read'
  | 'admin_users:write'
  | 'webhook_secret:rotate'
  | 'timeline:read';

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [
    'orders:read', 'orders:write',
    'transactions:read',
    'manual_verifications:read', 'manual_verifications:approve',
    'fraud_flags:read', 'fraud_flags:resolve',
    'audit_logs:read',
    'invoices:read',
    'android_devices:read',
    'admin_users:read', 'admin_users:write',
    'webhook_secret:rotate',
    'timeline:read',
  ],
  ADMIN: [
    'orders:read', 'orders:write',
    'transactions:read',
    'manual_verifications:read', 'manual_verifications:approve',
    'fraud_flags:read', 'fraud_flags:resolve',
    'audit_logs:read',
    'invoices:read',
    'android_devices:read',
    'timeline:read',
  ],
  SUPPORT: [
    'orders:read',
    'transactions:read',
    'manual_verifications:read', 'manual_verifications:approve',
    'invoices:read',
    'android_devices:read',
    'timeline:read',
  ],
  FINANCE: [
    'orders:read',
    'transactions:read',
    'audit_logs:read',
    'invoices:read',
    'timeline:read',
  ],
  READ_ONLY: [
    'orders:read',
    'transactions:read',
  ],
};
