import { useRef, useState, useEffect } from 'react';

interface Option {
  key: string;
  label: string;
}

interface SegmentedProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function Segmented({ options, value, onChange, className = '' }: SegmentedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const activeIdx = options.findIndex(o => o.key === value);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const buttons = container.querySelectorAll<HTMLButtonElement>('[data-seg-btn]');
    const btn = buttons[activeIdx];
    if (btn) {
      setPill({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [activeIdx]);

  return (
    <div ref={containerRef} className={`relative flex rounded-2xl bg-nero/[0.06] p-1 dark:bg-white/[0.06] ${className}`}>
      <div
        className="absolute top-1 bottom-1 rounded-xl bg-white shadow-sm transition-all duration-300 ease-out dark:bg-white/[0.12]"
        style={{ left: pill.left, width: pill.width }}
      />
      {options.map((option) => {
        const active = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            data-seg-btn
            onClick={() => onChange(option.key)}
            className={`relative z-[1] flex-1 rounded-xl px-3 py-2 text-xs font-bold transition-colors duration-200 active:scale-[0.98] ${
              active
                ? 'text-nero dark:text-cream'
                : 'text-nero/40 hover:text-nero/60 dark:text-cream/40 dark:hover:text-cream/60'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
