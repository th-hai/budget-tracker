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
  return (
    <div className={`flex gap-1 rounded-2xl bg-nero/5 p-1 dark:bg-white/5 ${className}`}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 active:scale-[0.98] ${
              active
                ? 'bg-white text-nero shadow-sm dark:bg-white/10 dark:text-cream'
                : 'text-nero/45 hover:text-nero/70 dark:text-cream/45 dark:hover:text-cream/70'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
