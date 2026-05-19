import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

interface DrillTransaction {
  _id: string;
  amount: number;
  note: string;
}

interface CategoryAnalyticsProps {
  cats: CategoryData[];
  daily?: DailyData[];
  chartType: ChartType;
  daysInRange?: number;
  onSelectCategory?: (category: string) => void;
  onDrillCategory?: (category: string | null) => void;
  drillTransactions?: DrillTransaction[];
  drillLoading?: boolean;
}

function tint(color: string, index: number) {
  const fallbacks = ['#4ECDC4', '#F4A98A', '#89C4F4', '#B8A9E8', '#F0D87A', '#D4A4E8'];
  return color || fallbacks[index % fallbacks.length];
}

function generateTints(baseColor: string, count: number): string[] {
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const factor = 0.5 + (i / Math.max(count - 1, 1)) * 0.8;
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    if (factor <= 1) {
      colors.push(`rgb(${clamp(r * factor)}, ${clamp(g * factor)}, ${clamp(b * factor)})`);
    } else {
      const f = factor - 1;
      colors.push(`rgb(${clamp(r + (255 - r) * f)}, ${clamp(g + (255 - g) * f)}, ${clamp(b + (255 - b) * f)})`);
    }
  }
  return colors;
}

type CatWithColor = CategoryData & { color: string; label: string };

// ─── Unified slice for the morphing donut ────────────
interface DonutSlice {
  id: string;
  label: string;
  value: number;
  color: string;
  pct?: number;
  clickId?: string; // category key for main slices
}

// ─── Single Morphing Donut ───────────────────────────
// One SVG ring that collapses → swaps data → re-expands.
// "phase" drives the animation:
//   stable  → segments are fully drawn
//   collapsing → segments animate dashOffset back to `circumference`
//   expanding  → segments animate dashOffset to their target
type MorphPhase = 'stable' | 'collapsing' | 'expanding';

const SIZE = 116;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;
const GAP = 3;
const COLLAPSE_MS = 400;
const EXPAND_MS = 550;

function MorphingDonut({
  slices,
  onClickSlice,
  centerContent,
}: {
  slices: DonutSlice[];
  onClickSlice?: (id: string) => void;
  centerContent: React.ReactNode;
}) {
  // What the SVG actually renders right now
  const [rendered, setRendered] = useState<DonutSlice[]>(slices);
  const [phase, setPhase] = useState<MorphPhase>('expanding');
  const [activeIdx, setActiveIdx] = useState(-1);
  const pendingRef = useRef<DonutSlice[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Detect slice changes → trigger collapse then expand
  const sliceKey = slices.map(s => s.id).join(',');
  const renderedKey = rendered.map(s => s.id).join(',');

  useEffect(() => {
    // On very first render, just expand
    if (renderedKey === '' && sliceKey !== '') {
      setRendered(slices);
      setPhase('expanding');
      return;
    }
    // If slices actually changed, start collapse → swap → expand
    if (sliceKey !== renderedKey && phase === 'stable') {
      pendingRef.current = slices;
      setActiveIdx(-1);
      setPhase('collapsing');

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        // Swap to new data at the collapsed point
        setRendered(pendingRef.current || slices);
        pendingRef.current = null;
        setPhase('expanding');
      }, COLLAPSE_MS + rendered.length * 30 + 40);
    }
    // If slices changed while we're already animating, just queue
    if (sliceKey !== renderedKey && phase !== 'stable') {
      pendingRef.current = slices;
    }
  }, [sliceKey]);

  // Mark stable once expand finishes
  useEffect(() => {
    if (phase === 'expanding') {
      const t = setTimeout(() => {
        setPhase('stable');
        // If something queued during the expand, start another cycle
        if (pendingRef.current && pendingRef.current.map(s => s.id).join(',') !== rendered.map(s => s.id).join(',')) {
          const next = pendingRef.current;
          pendingRef.current = null;
          setActiveIdx(-1);
          setPhase('collapsing');
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            setRendered(next);
            setPhase('expanding');
          }, COLLAPSE_MS + rendered.length * 30 + 40);
        }
      }, EXPAND_MS + rendered.length * 40 + 50);
      return () => clearTimeout(t);
    }
  }, [phase, rendered]);

  // Cleanup
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Compute segment geometry
  const total = rendered.reduce((s, sl) => s + sl.value, 0);
  const segments = useMemo(() => {
    const visible = rendered.filter(s => s.value > 0);
    const totalGap = GAP * visible.length;
    const usable = CIRC - totalGap;
    let acc = 0;
    return rendered.map((s) => {
      const len = total > 0 && s.value > 0 ? (s.value / total) * usable : 0;
      const off = acc;
      acc += len + (s.value > 0 ? GAP : 0);
      return { len, off };
    });
  }, [rendered, total]);

  const isCollapsing = phase === 'collapsing';
  const isExpanding = phase === 'expanding';
  const active = activeIdx >= 0 ? rendered[activeIdx] : null;

  return (
    <div className="relative h-[116px] w-[116px] shrink-0">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" style={{ cursor: 'pointer' }}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--track)" strokeWidth={STROKE} />
        {rendered.map((slice, i) => {
          const seg = segments[i];
          // Collapsed = dashOffset at circumference (hidden at 12 o'clock)
          // Expanded = dashOffset at -seg.off (correct arc position)
          const dashOffset = isCollapsing ? CIRC : isExpanding ? -seg.off : -seg.off;

          // Stagger: expanding = first→last, collapsing = last→first (counter-clockwise feel)
          const delay = isCollapsing
            ? (rendered.length - 1 - i) * 30
            : i * 40;
          const duration = isCollapsing ? COLLAPSE_MS : EXPAND_MS;
          const easing = isCollapsing ? 'cubic-bezier(0.5, 0, 0.75, 0.4)' : 'cubic-bezier(0.15, 0.7, 0.25, 1)';

          const isActive = activeIdx === i;
          const isOther = activeIdx >= 0 && !isActive;

          return (
            <circle
              key={`${slice.id}-${i}`}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth={STROKE}
              strokeDasharray={`${Math.max(0, seg.len)} ${CIRC - seg.len}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              opacity={isCollapsing ? 0.7 : isOther ? 0.35 : 1}
              style={{
                transition: `stroke-dashoffset ${duration}ms ${easing} ${delay}ms, opacity 200ms ease`,
                cursor: isCollapsing ? 'default' : 'pointer',
              }}
              onMouseEnter={() => phase === 'stable' && setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(-1)}
              onClick={() => {
                if (phase === 'stable' && slice.clickId) onClickSlice?.(slice.clickId);
              }}
            />
          );
        })}
      </svg>
      {/* Center content: crossfade between hover state and default */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        {active && phase === 'stable' ? (
          <div>
            <span className="block text-sm font-bold tracking-[-0.04em]">{formatVNDShort(active.value)}</span>
            <span className="block text-[8px] font-bold max-w-[70px] truncate" style={{ color: 'var(--text-muted)' }}>
              {active.label}
            </span>
            {active.pct !== undefined && (
              <span className="block text-[9px] font-bold" style={{ color: active.color }}>{active.pct}%</span>
            )}
          </div>
        ) : (
          <div
            className="pointer-events-auto transition-opacity duration-500"
            style={{ opacity: isCollapsing ? 0 : 1 }}
          >
            {centerContent}
          </div>
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

// ─── Sub-slice type (for legend) ─────────────────────
interface SubSlice {
  id: string;
  label: string;
  amount: number;
  color: string;
  pct: number;
}

// ─── Main export ──────────────────────────────────────
export default function CategoryAnalytics({
  cats,
  daily = [],
  chartType,
  daysInRange = 1,
  onSelectCategory,
  onDrillCategory,
  drillTransactions,
  drillLoading,
}: CategoryAnalyticsProps) {
  const [drilledCategory, setDrilledCategory] = useState<string | null>(null);

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

  // Reset drill when cats change (e.g. switching date range)
  useEffect(() => {
    setDrilledCategory(null);
  }, [cats]);

  const drilledMeta = drilledCategory ? getCategoryByKey(drilledCategory) : null;
  const drilledCatData = drilledCategory ? prepared.find(c => c.category === drilledCategory) : null;

  // Build sub-slices from drill transactions
  const subSlices = useMemo((): SubSlice[] => {
    if (!drilledCategory || !drillTransactions?.length || !drilledCatData) return [];
    const txTotal = drillTransactions.reduce((s, tx) => s + tx.amount, 0);
    if (txTotal <= 0) return [];
    const sorted = [...drillTransactions].sort((a, b) => b.amount - a.amount);
    const maxSlices = 6;
    const main = sorted.slice(0, maxSlices);
    const rest = sorted.slice(maxSlices);
    const restTotal = rest.reduce((s, tx) => s + tx.amount, 0);
    const baseColor = drilledCatData.color;
    const sliceCount = main.length + (restTotal > 0 ? 1 : 0);
    const colors = generateTints(baseColor, sliceCount);
    const slices: SubSlice[] = main.map((tx, i) => ({
      id: tx._id,
      label: tx.note || drilledMeta?.label || drilledCategory,
      amount: tx.amount,
      color: colors[i],
      pct: Math.round((tx.amount / txTotal) * 100),
    }));
    if (restTotal > 0) {
      slices.push({
        id: '__other__',
        label: `+${rest.length} khác`,
        amount: restTotal,
        color: colors[colors.length - 1],
        pct: Math.round((restTotal / txTotal) * 100),
      });
    }
    return slices;
  }, [drilledCategory, drillTransactions, drilledCatData, drilledMeta]);

  // ── Convert to unified DonutSlice format ──
  const total = prepared.reduce((sum, cat) => sum + cat.total, 0);
  const top = prepared.slice(0, 6);

  const mainDonutSlices = useMemo((): DonutSlice[] =>
    top.map(cat => ({
      id: `cat-${cat.category}`,
      label: cat.label,
      value: cat.total,
      color: cat.color,
      clickId: cat.category,
    })), [top]);

  const subDonutSlices = useMemo((): DonutSlice[] =>
    subSlices.map(s => ({
      id: `sub-${s.id}`,
      label: s.label,
      value: s.amount,
      color: s.color,
      pct: s.pct,
      clickId: drilledCategory || undefined, // clicking any sub-slice opens the category sheet
    })), [subSlices, drilledCategory]);

  const isDrilled = !!drilledCategory && subDonutSlices.length > 0 && !drillLoading;

  // Which slices the donut should show
  const donutSlices = isDrilled ? subDonutSlices : mainDonutSlices;

  const handleDonutClick = useCallback((clickId: string) => {
    if (drilledCategory) {
      // Already drilled — clicking a sub-slice opens the category sheet
      onSelectCategory?.(drilledCategory);
      return;
    }
    setDrilledCategory(clickId);
    onDrillCategory?.(clickId);
  }, [drilledCategory, onDrillCategory, onSelectCategory]);

  const handleBackFromDrill = useCallback(() => {
    setDrilledCategory(null);
    onDrillCategory?.(null);
  }, [onDrillCategory]);

  if (!prepared.length) {
    return (
      <div className="py-10 text-center flex flex-col items-center">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="mb-2 opacity-12">
          <circle cx="22" cy="22" r="16" stroke="currentColor" strokeWidth="2"/>
          <path d="M22 6a16 16 0 0 1 13.86 8L22 22V6z" fill="currentColor" opacity="0.15"/>
          <path d="M35.86 14A16 16 0 0 1 22 38V22l13.86-8z" fill="currentColor" opacity="0.08"/>
        </svg>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu chi tiêu</p>
      </div>
    );
  }

  const rows = prepared.slice(0, 3);

  // Center content for the donut
  const centerContent = isDrilled ? (
    <button
      type="button"
      onClick={handleBackFromDrill}
      className="flex flex-col items-center gap-0.5 rounded-full p-1.5 transition-all hover:bg-nero/[0.04] active:scale-90 dark:hover:bg-white/[0.06]"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: drilledCatData?.color }}>
        <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-[8px] font-bold" style={{ color: 'var(--text-muted)' }}>
        {drilledCatData?.label}
      </span>
    </button>
  ) : (
    <div className="pointer-events-none">
      <span className="text-lg font-bold tracking-[-0.04em]">{formatVNDShort(total)}</span>
      <p className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>Tổng chi</p>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-2 items-center">
        <div className="flex justify-center">
          {chartType === 'donut' && (
            <div className="relative h-[116px] w-[116px]">
              <MorphingDonut
                slices={donutSlices}
                onClickSlice={handleDonutClick}
                centerContent={centerContent}
              />
              {/* Loading spinner when fetching drill data */}
              {drilledCategory && drillLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--surface-card)]/60 rounded-full">
                  <div className="h-8 w-8 rounded-full border-2 border-[color:var(--track)] border-t-[color:var(--accent)] animate-spin" />
                </div>
              )}
            </div>
          )}
          {chartType === 'bar' && <BarChart cats={top} onSelect={onSelectCategory} />}
          {chartType === 'stacked' && <StackedChart cats={top} total={total} onSelect={onSelectCategory} />}
          {chartType === 'daily' && <DailyChart daily={daily} />}
        </div>

        {/* Legend area */}
        <div className="relative min-h-[100px] pl-2">
          {/* Main legend */}
          <div
            className="flex flex-col gap-1"
            style={{
              opacity: isDrilled ? 0 : 1,
              transform: isDrilled ? 'translateX(8px)' : 'translateX(0)',
              pointerEvents: isDrilled ? 'none' : 'auto',
              position: isDrilled ? 'absolute' : 'relative',
              inset: isDrilled ? 0 : undefined,
              transition: 'opacity 400ms ease, transform 400ms ease',
            }}
          >
            {top.map((cat) => (
              <button
                key={cat.category}
                type="button"
                onClick={() => {
                  if (chartType === 'donut') handleDonutClick(cat.category);
                  else onSelectCategory?.(cat.category);
                }}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-left transition-opacity active:opacity-70"
                style={{ backgroundColor: `${cat.color}10` }}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="min-w-0 flex-1 truncate text-[11px] font-semibold" style={{ color: cat.color }}>{cat.label}</span>
                <span className="text-[11px] font-bold" style={{ color: cat.color }}>{formatVNDShort(cat.total)}</span>
              </button>
            ))}
          </div>
          {/* Sub-donut legend */}
          {isDrilled && drilledCatData && (
            <div
              className="flex flex-col gap-1 animate-fadeSlideIn"
            >
              {/* Back button */}
              <button
                type="button"
                onClick={handleBackFromDrill}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-left transition-all active:opacity-70 mb-0.5"
                style={{ backgroundColor: `${drilledCatData.color}15` }}
              >
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ color: drilledCatData.color }}>
                  <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[11px] font-bold" style={{ color: drilledCatData.color }}>{drilledCatData.label}</span>
                <span className="text-[10px] font-semibold ml-auto" style={{ color: 'var(--text-muted)' }}>{formatVNDShort(drilledCatData.total)}</span>
              </button>
              {subSlices.slice(0, 4).map((slice) => (
                <div
                  key={slice.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 text-left"
                  style={{ backgroundColor: `${slice.color}12` }}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                  <span className="min-w-0 flex-1 truncate text-[11px] font-semibold" style={{ color: slice.color }}>{slice.label}</span>
                  <span className="text-[10px] font-bold shrink-0" style={{ color: slice.color }}>{formatVNDShort(slice.amount)}</span>
                </div>
              ))}
              {subSlices.length > 4 && (
                <p className="text-[10px] font-semibold px-2" style={{ color: 'var(--text-muted)' }}>
                  +{subSlices.length - 4} mục khác
                </p>
              )}
            </div>
          )}
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
