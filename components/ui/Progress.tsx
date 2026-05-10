import { useEffect, useState } from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  height?: number;
  accent?: string;
}

export default function Progress({ value, max = 100, height = 8, accent = 'var(--accent)' }: ProgressProps) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const clamped = Math.max(0, Math.min(100, pct));
  const color = pct > 100 ? '#E85D5D' : pct >= 70 ? '#D4922A' : accent;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    setAnimated(0);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimated(clamped));
    });
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  return (
    <div
      className="w-full overflow-hidden rounded-full"
      style={{
        height,
        background: 'var(--track)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.08)',
      }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${animated}%`,
          background: color,
          transition: 'width 800ms ease-out',
        }}
      />
    </div>
  );
}
