import { ReactNode } from 'react';
import { useTheme } from '@/lib/theme';

interface ChipProps {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function Chip({ active = false, children, onClick, className = '' }: ChipProps) {
  const { style } = useTheme();
  const activeClass = style === 'playful'
    ? 'bg-yolk text-nero shadow-sm'
    : 'bg-teal/15 text-teal shadow-sm';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`snap-start whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-150 active:scale-[0.98] ${
        active ? activeClass : 'bg-nero/5 text-nero/45 hover:bg-nero/10 dark:bg-white/5 dark:text-cream/45 dark:hover:bg-white/10'
      } ${className}`}
    >
      {children}
    </button>
  );
}
