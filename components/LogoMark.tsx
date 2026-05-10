interface LogoMarkProps {
  size?: number;
  accent?: string;
  wordmark?: boolean;
}

export default function LogoMark({ size = 34, accent = 'var(--accent)', wordmark = false }: LogoMarkProps) {
  const mark = (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      <rect x="4" y="4" width="72" height="72" rx="22" fill={accent} />
      <path
        d="M24 53c0-7 6-13 16-13s16 6 16 13c0 5-5 9-16 9s-16-4-16-9Z"
        fill="#FFFDF7"
        opacity="0.95"
      />
      <path
        d="M40 41c-10-2-16-10-15-22 11-1 18 6 17 18"
        fill="none"
        stroke="#FFFDF7"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42 39c10-1 16-9 15-21-11 0-18 6-18 18"
        fill="none"
        stroke="#FFFDF7"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40 36v18"
        fill="none"
        stroke="#FFFDF7"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M31 52h18"
        fill="none"
        stroke={accent}
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );

  if (!wordmark) return mark;

  return (
    <div className="inline-flex items-center gap-2">
      {mark}
      <span className="text-xl font-bold tracking-[-0.04em] text-[color:var(--text-primary)]">
        Budgetddy
      </span>
    </div>
  );
}
