import { getCategoryByKey } from '@/lib/categories';

interface CategoryIconProps {
  category: string;
  size?: number;
  useEmoji?: boolean;
}

export default function CategoryIcon({ category, size = 32, useEmoji = true }: CategoryIconProps) {
  const cat = getCategoryByKey(category);
  const label = cat?.label || category;

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: (cat?.color || '#B8BFC6') + '33',
        color: cat?.color || 'var(--accent)',
      }}
      aria-label={label}
    >
      {useEmoji ? (
        <span style={{ fontSize: Math.round(size * 0.52) }}>{cat?.icon || '📌'}</span>
      ) : (
        <span className="text-xs">{label.slice(0, 1)}</span>
      )}
    </span>
  );
}
