import { createAdminClient } from '@/lib/supabase/server';

interface AuditLogInput {
  actorType: 'SYSTEM' | 'ANDROID' | 'ADMIN' | 'CUSTOMER';
  actorId?: string;
  eventType: string;
  entityType: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function appendAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from('audit_logs').insert({
      actor_type: input.actorType,
      actor_id: input.actorId ?? null,
      event_type: input.eventType,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      payload: input.payload ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    });
  } catch (err) {
    // Audit logging must NEVER throw — errors are silently swallowed
    console.error('[AuditLog] Failed to write audit log:', err);
  }
}
