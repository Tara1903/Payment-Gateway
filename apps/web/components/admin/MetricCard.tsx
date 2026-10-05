type Color = 'emerald' | 'violet' | 'amber' | 'red' | 'blue';

const COLORS: Record<Color, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'rgb(52 211 153 / 0.08)', text: 'rgb(52 211 153)', border: 'rgb(52 211 153 / 0.2)' },
  violet: { bg: 'rgb(139 92 246 / 0.08)', text: 'rgb(139 92 246)', border: 'rgb(139 92 246 / 0.2)' },
  amber: { bg: 'rgb(251 191 36 / 0.08)', text: 'rgb(251 191 36)', border: 'rgb(251 191 36 / 0.2)' },
  red: { bg: 'rgb(248 113 113 / 0.08)', text: 'rgb(248 113 113)', border: 'rgb(248 113 113 / 0.2)' },
  blue: { bg: 'rgb(96 165 250 / 0.08)', text: 'rgb(96 165 250)', border: 'rgb(96 165 250 / 0.2)' },
};

interface Props {
  title: string;
  value: string;
  sub?: string;
  color: Color;
  icon: string;
  alert?: boolean;
}

export function MetricCard({ title, value, sub, color, icon, alert }: Props) {
  const c = COLORS[color];
  return (
    <div
      className="rounded-2xl p-3.5 sm:p-5 relative"
      style={{ background: 'rgb(13 17 37)', border: `1px solid ${alert ? c.border : 'rgb(255 255 255 / 0.06)'}` }}
    >
      {alert && (
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-2 h-2 rounded-full animate-pulse" style={{ background: c.text }} />
      )}
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <span
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm shrink-0"
          style={{ background: c.bg }}
        >
          {icon}
        </span>
        <p className="text-[11px] sm:text-xs font-medium truncate" style={{ color: 'rgb(100 116 139)' }}>{title}</p>
      </div>
      <p className="text-lg sm:text-2xl font-bold font-mono tracking-tight" style={{ color: c.text }}>{value}</p>
      {sub && <p className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate" style={{ color: 'rgb(71 85 105)' }}>{sub}</p>}
    </div>
  );
}
