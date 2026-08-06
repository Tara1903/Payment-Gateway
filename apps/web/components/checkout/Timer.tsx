'use client';

import { useState, useEffect } from 'react';

interface Props {
  expiresAt: string;
  onExpired?: () => void;
}

export function Timer({ expiresAt, onExpired }: Props) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff === 0) onExpired?.();
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isWarning = remaining < 120; // < 2 minutes
  const isDanger = remaining < 60;   // < 1 minute

  const color = isDanger ? 'rgb(248 113 113)' : isWarning ? 'rgb(251 191 36)' : 'rgb(52 211 153)';

  return (
    <div
      className="rounded-xl p-3 flex items-center justify-between text-sm"
      style={{
        background: `${color.replace('rgb', 'rgba').replace(')', ' / 0.08)')}`,
        border: `1px solid ${color.replace('rgb', 'rgba').replace(')', ' / 0.2)')}`,
      }}
    >
      <span style={{ color: 'rgb(148 163 184)' }}>QR expires in</span>
      <span className="font-mono font-bold" style={{ color }}>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
