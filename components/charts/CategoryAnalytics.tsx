import { useEffect, useMemo, useState } from 'react';
import { getCategoryByKey } from '@/lib/categories';
import { formatVNDShort } from '@/lib/format';
import { ChartType } from '@/lib/theme';
import CategoryIcon from '@/components/ui/CategoryIcon';
import Progress from '@/components/ui/Progress';

interface CategoryData {
  category: string;
  total: number;
  count?: number;
  budget?: number | null;
}

interface DailyData {
  date: string;
  expense?: number;
}

interface CategoryAnalyticsProps {
  cats: CategoryData[];
  daily?: DailyData[];
  chartType: ChartType;
  daysInRange?: number;
  onSelectCategory?: (category: string) => void;
}

function tint(color: string, index: number) {
  const fallbacks = ['#4ECDC4', '#F4A98A', '#89C4F4', '#B8A9E8', '#F0D87A', '#D4A4E8'];
  return color || fallbacks[index % fallbacks.length];
}

type CatWithColor = CategoryData & { color: string; label: string };

// ─── Donut (interactive) ──────────────────────────────
function AnimatedDonut({ cats, total, onSelect }: { cats: CatWithColor[]; total: number; onSelect?: (cat: string) => void }) {
  const [mounted, setMounted] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const size = 116;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circle = 2 * Math.PI * radius;

  useEffect(() => {
    setMounted(false);
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    return () => cancelAnimationFrame(raf);
  }, [cats]);

  // Build segment offsets with proper gap handling
  const GAP = 3;
  const segments = useMemo(() => {
    const visibleCats = cats.filter(c => c.total > 0);
    const totalGap = GAP * visibleCats.length;
    const usable = circle - totalGap;
    let acc = 0;
    return cats.map((cat) => {
      const len = total > 0 && cat.total > 0 ? (cat.total / total) * usable : 0;
      const off = acc;
      acc += len + (cat.total > 0 ? GAP : 0);
      return { len, off };
    });
  }, [cats, total, circle]);

  const active = activeIdx >= 0 ? cats[activeIdx] : null;

  return (
    <div className="relative h-[116px] w-[116px] shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" style={{ cursor: 'pointer' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        {cats.map((cat, i) => {
          const seg = segments[i];
          const dashOffset = mounted ? -seg.off : circle;
          const isActive = activeIdx === i;
          const isOther = activeIdx >= 0 && !isActive;
          return (
            <circle
              key={cat.category}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={cat.color}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, seg.len)} ${circle - seg.len}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              opacity={isOther ? 0.35 : 1}
              style={{
                transition: `stroke-dashoffset 800ms ease-out ${i * 40}ms, opacity 200ms ease`,
                cursor: 'pointer',
              }}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(-1)}
              onClick={() => onSelect?.(cat.category)}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        {active ? (
          <>
            <span className="text-base font-bold tracking-[-0.04em]">{formatVNDShort(active.total)}</span>
            <span className="text-[9px] font-bold" style={{ color: 'var(--text-muted)' }}>
              {active.label}
            </span>
          </>
        ) : (
          <>
            <span className="text-lg font-bold tracking-[-0.04em]">{formatVNDShort(total)}</span>
            <span className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>Tổng chi</span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Bar ──────────────────────────────────────────────
function BarChart({ cats, onSelect }: { cats: CatWithColor[]; onSelect?: (cat: string) => void }) {
  const max = Math.max(...cats.map((cat) => cat.total), 1);
  return (
    <div className="flex h-[138px] w-[138px] shrink-0 items-end gap-2 rounded-2xl bg-nero/[0.03] px-3 py-4 dark:bg-white/[0.04]">
      {cats.map((cat, index) => (
        <div key={cat.category} className="flex flex-1 items-end" style={{ cursor: 'pointer' }} onClick={() => onSelect?.(cat.category)}>
          <div
            className="w-full rounded-t-lg transition-all duration-150 hover:opacity-80 active:scale-y-95"
            style={{
              height: Math.max(8, (cat.total / max) * 92),
              backgroundColor: cat.color,
              transition: `height 800ms ease-out ${index * 40}ms`,
              transformOrigin: 'bottom',
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Stacked ──────────────────────────────────────────
function StackedChart({ cats, total, onSelect }: { cats: CatWithColor[]; total: number; onSelect?: (cat: string) => void }) {
  return (
    <div className="flex h-[138px] w-[138px] shrink-0 flex-col justify-center gap-3">
      <div className="flex h-[26px] overflow-hidden rounded-full bg-[color:var(--track)]">
        {cats.map((cat) => (
          <div
            key={cat.category}
            className="cursor-pointer transition-opacity hover:opacity-80"
            onClick={() => onSelect?.(cat.category)}
            style={{ flex: total > 0 ? cat.total / total : 0, backgroundColor: cat.color }}
          />
        ))}
      </div>
      <div className="text-center">
        <p className="text-xl font-bold tracking-[-0.04em]">{formatVNDShort(total)}</p>
        <p className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Tổng chi</p>
      </div>
    </div>
  );
}

// ─── Daily ────────────────────────────────────────────
function DailyChart({ daily }: { daily: DailyData[] }) {
  const series = daily.slice(-14);
  const filled = series.length ? series : [{ date: new Date().toISOString(), expense: 0 }];
  const max = Math.max(...filled.map((item) => item.expense || 0), 1);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex h-[138px] w-[138px] shrink-0 flex-col justify-end gap-2 rounded-2xl bg-nero/[0.03] p-3 dark:bg-white/[0.04]">
      <div className="flex h-[92px] items-end gap-0.5">
        {filled.map((item, index) => {
          const isToday = item.date === today || index === filled.length - 1;
          return (
            <div
              key={`${item.date}-${index}`}
              className="flex-1 rounded-sm"
              style={{
                height: Math.max(3, ((item.expense || 0) / max) * 78),
                backgroundColor: isToday ? 'var(--accent)' : 'var(--chart-muted)',
              }}
            />
          );
        })}
      </div>
      <p className="text-center text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>14 ngày</p>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────
export default function CategoryAnalytics({ cats, daily = [], chartType, daysInRange = 1, onSelectCategory }: CategoryAnalyticsProps) {
  const prepared = useMemo(() => cats
    .filter((cat) => cat.total > 0)
    .map((cat, index) => {
      const meta = getCategoryByKey(cat.category);
      return {
        ...cat,
        label: meta?.label || cat.category,
        color: tint(meta?.color || '', index),
      };
    }), [cats]);

  if (!prepared.length) {
    return <div className="py-10 text-center text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu chi tiêu</div>;
  }

  const total = prepared.reduce((sum, cat) => sum + cat.total, 0);
  const top = prepared.slice(0, 6);
  const rows = prepared.slice(0, 3);

  return (
    <div>
      <div className="grid grid-cols-2 items-center">
        <div className="flex justify-center">
          {chartType === 'donut' && <AnimatedDonut cats={top} total={total} onSelect={onSelectCategory} />}
          {chartType === 'bar' && <BarChart cats={top} onSelect={onSelectCategory} />}
          {chartType === 'stacked' && <StackedChart cats={top} total={total} onSelect={onSelectCategory} />}
          {chartType === 'daily' && <DailyChart daily={daily} />}
        </div>

        <div className="flex flex-col gap-1.5 pl-2">
          {top.slice(0, 4).map((cat) => (
            <button
              key={cat.category}
              type="button"
              onClick={() => onSelectCategory?.(cat.category)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-opacity active:opacity-70"
              style={{ backgroundColor: `${cat.color}10` }}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="min-w-0 flex-1 truncate text-[12px] font-semibold" style={{ color: cat.color }}>{cat.label}</span>
              <span className="text-[12px] font-bold" style={{ color: cat.color }}>{formatVNDShort(cat.total)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-1.5 border-t border-nero/8 pt-4 dark:border-white/8">
        {rows.map((cat) => {
          const budget = cat.budget || total;
          const pct = total > 0 ? Math.round((cat.total / total) * 100) : 0;
          const avgDay = daysInRange > 1 ? Math.round(cat.total / daysInRange) : null;
          return (
            <button
              key={cat.category}
              type="button"
              onClick={() => onSelectCategory?.(cat.category)}
              className="w-full text-left active:scale-[0.99] transition-transform rounded-2xl px-2.5 py-2 flex items-center gap-2.5"
              style={{ backgroundColor: `${cat.color}10` }}
            >
              <CategoryIcon category={cat.category} size={34} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-bold truncate" style={{ color: cat.color }}>{cat.label}</span>
                    {avgDay !== null && (
                      <span className="text-[10px] font-medium text-[color:var(--text-muted)] shrink-0">TB {formatVNDShort(avgDay)}/ngày</span>
                    )}
                  </div>
                  <span className="text-[14px] font-bold shrink-0 ml-2" style={{ color: cat.color }}>{pct}%</span>
                </div>
                <Progress value={cat.total} max={budget} height={4} accent={cat.color} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
