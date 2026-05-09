import { useState, useEffect } from 'react';

interface ProgressBarProps {
  value: number;
  label?: string;
  sublabel?: string;
}

export default function ProgressBar({ value, label, sublabel }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const barColor = clampedValue > 90 ? '#E85D5D' : clampedValue > 70 ? '#D4922A' : '#3BB8B0';

  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    setAnimated(0);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimated(clampedValue));
    });
    return () => cancelAnimationFrame(raf);
  }, [clampedValue]);

  return (
    <div className="w-full">
      {(label || sublabel) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-bold">{label}</span>}
          {sublabel && <span className="text-xs font-semibold opacity-50">{sublabel}</span>}
        </div>
      )}
      <div
        className="w-full h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: '#DDDBD6', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.08)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${animated}%`,
            backgroundColor: barColor,
            transition: 'width 800ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
    </div>
  );
}
