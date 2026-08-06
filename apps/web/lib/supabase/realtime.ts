'use client';

import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to real-time order status changes.
 * The callback is called whenever the order row is updated.
 */
export function subscribeToOrderStatus(
  orderId: string,
  onUpdate: (status: string) => void
): () => void {
  const supabase = createClient();

  const channel: RealtimeChannel = supabase
    .channel(`order-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        const newStatus = (payload.new as { status?: string }).status;
        if (newStatus) {
          onUpdate(newStatus);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
