'use client';

import { useEffect, useState } from 'react';
import { TimelineStep } from './TimelineStep';
import { TimelineSkeleton } from './TimelineSkeleton';
import { TIMELINE_LABELS, TIMELINE_COLORS } from '@/lib/constants/timelineEvents';
import type { TimelineEventType } from '@starpay/types';

interface TimelineEvent {
  id: string;
  event: TimelineEventType;
  label: string;
  description: string | null;
  occurred_at: string;
  actor_type: string;
  meta: Record<string, unknown>;
}

interface Props {
  orderId: string;
}

export function VerificationTimeline({ orderId }: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/orders/${orderId}/timeline`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setEvents(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId]);

  if (loading) return <TimelineSkeleton />;

  if (events.length === 0) {
    return <p style={{ color: 'rgb(148 163 184)', fontSize: '0.875rem' }}>No timeline events yet.</p>;
  }

  return (
    <div className="flex flex-col">
      {events.map((event, idx) => (
        <TimelineStep
          key={event.id}
          event={event}
          isLast={idx === events.length - 1}
          color={TIMELINE_COLORS[event.event] ?? 'bg-slate-500'}
        />
      ))}
    </div>
  );
}
