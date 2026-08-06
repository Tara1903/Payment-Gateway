import { createAdminClient } from '@/lib/supabase/server';
import type { AppendTimelineInput, TimelineEvent } from '@starpay/types';

export async function appendTimeline(input: AppendTimelineInput): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from('order_timeline').insert({
      order_id: input.orderId,
      event: input.event,
      actor_type: input.actorType,
      actor_id: input.actorId ?? null,
      label: input.label,
      description: input.description ?? null,
      meta: input.meta ?? {},
      occurred_at: input.occurredAt ?? new Date().toISOString(),
    });
  } catch (err) {
    // Timeline is append-only and non-blocking — never throw
    console.error('[Timeline] Failed to append event:', err);
  }
}

export async function getTimeline(orderId: string): Promise<TimelineEvent[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('order_timeline')
      .select('*')
      .eq('order_id', orderId)
      .order('occurred_at', { ascending: true });

    if (error || !data) return [];
    return data as TimelineEvent[];
  } catch {
    return [];
  }
}
