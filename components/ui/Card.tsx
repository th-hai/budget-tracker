import { HTMLAttributes } from 'react';
import { useTheme } from '@/lib/theme';

export default function Card({
  className = '',
  children,
  density,
  ...props
}: HTMLAttributes<HTMLDivElement> & { density?: 'compact' | 'roomy' }) {
  const theme = useTheme();
  const resolvedDensity = density || theme.density;
  const padding = resolvedDensity === 'compact' ? 'p-[18px]' : 'p-[22px]';

  return (
    <div className={`card-brutal ${padding} ${className}`} {...props}>
      {children}
    </div>
  );
}
