import { formatTime } from '@starpay/shared';
import type { TimelineEventType } from '@starpay/types';
import { TIMELINE_ICONS } from '@/lib/constants/timelineEvents';

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
  event: TimelineEvent;
  isLast: boolean;
  color: string;
}

export function TimelineStep({ event, isLast, color }: Props) {
  const isSuccess = ['APPROVED', 'AMOUNT_VERIFIED', 'FRAUD_CHECK_PASSED', 'MANUAL_APPROVED'].includes(event.event);
  const isFailure = ['FRAUD_CHECK_FAILED', 'ORDER_FAILED', 'MANUAL_REJECTED'].includes(event.event);
  const isWarning = ['FALLBACK_TRIGGERED', 'MANUAL_SUBMITTED', 'ORDER_EXPIRED'].includes(event.event);

  const dotBg = isSuccess ? 'rgb(52 211 153)'
    : isFailure ? 'rgb(248 113 113)'
    : isWarning ? 'rgb(251 191 36)'
    : 'rgb(139 92 246)';

  return (
    <div className="flex gap-4">
      {/* Dot + Line */}
      <div className="flex flex-col items-center">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
          style={{ background: `${dotBg}20`, border: `2px solid ${dotBg}` }}
        >
          {TIMELINE_ICONS[event.event]}
        </div>
        {!isLast && (
          <div className="w-px flex-1 my-1" style={{ background: 'rgb(255 255 255 / 0.08)', minHeight: '24px' }} />
        )}
      </div>

      {/* Content */}
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm" style={{ color: 'rgb(248 250 252)' }}>{event.label}</p>
          <span className="text-xs font-mono flex-shrink-0" style={{ color: 'rgb(71 85 105)' }}>
            {formatTime(event.occurred_at)}
          </span>
        </div>
        {event.description && (
          <p className="text-sm mt-0.5" style={{ color: 'rgb(148 163 184)' }}>{event.description}</p>
        )}
        <div className="flex gap-2 mt-1">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgb(255 255 255 / 0.04)', color: 'rgb(71 85 105)' }}
          >
            {event.actor_type}
          </span>
        </div>
      </div>
    </div>
  );
}
