import { useState } from 'react';
import useSWR from 'swr';
import fetcher from '@/lib/api';
import { formatVNDShort, formatDateSmart, formatTime } from '@/lib/format';
import PageShell from '@/components/layout/PageShell';
import Card from '@/components/ui/Card';
import Segmented from '@/components/ui/Segmented';
import Progress from '@/components/ui/Progress';
import CategoryIcon from '@/components/ui/CategoryIcon';
import CategoryAnalytics from '@/components/charts/CategoryAnalytics';
import CategoryDrilldownSheet from '@/components/charts/CategoryDrilldownSheet';
import TransactionDetail from '@/components/transaction/TransactionDetail';
import { L } from '@/lib/labels';
import { useTheme } from '@/lib/theme';
import { getCategoryByKey } from '@/lib/categories';

const RANGES = [
  { key: 'week', label: L.dashboard.filterWeek },
  { key: 'month', label: L.dashboard.filterMonth },
];

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getClientDateRange(range: string, month: number, year: number, offset: number = 0) {
  const VN_MS = 7 * 60 * 60 * 1000;
  const vn = new Date(Date.now() + VN_MS);
  const vY = vn.getUTCFullYear(), vM = vn.getUTCMonth(), vD = vn.getUTCDate();

  if (range === 'week') {
    const day = new Date(Date.UTC(vY, vM, vD)).getUTCDay();
    const mondayD = vD - ((day + 6) % 7) + offset * 7;
    const mon = new Date(Date.UTC(vY, vM, mondayD));
    const sun = new Date(Date.UTC(vY, vM, mondayD + 6));
    return {
      startDate: toDateInputValue(new Date(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate())),
      endDate: toDateInputValue(new Date(sun.getUTCFullYear(), sun.getUTCMonth(), sun.getUTCDate())),
    };
  }
  const m = month - 1 + offset;
  return {
    startDate: toDateInputValue(new Date(year, m, 1)),
    endDate: toDateInputValue(new Date(year, m + 1, 0)),
  };
}

const VN_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function getDateRangeLabel(range: string, month: number, year: number, offset: number = 0) {
  const VN_MS = 7 * 60 * 60 * 1000;
  const vn = new Date(Date.now() + VN_MS);
  const vY = vn.getUTCFullYear(), vM = vn.getUTCMonth(), vD = vn.getUTCDate();
  const p = (n: number) => (n < 10 ? `0${n}` : String(n));

  if (range === 'week') {
    const day = vn.getUTCDay();
    const mondayD = vD - ((day + 6) % 7) + offset * 7;
    const monDate = new Date(Date.UTC(vY, vM, mondayD));
    const sunDate = new Date(Date.UTC(vY, vM, mondayD + 6));
    return `${p(monDate.getUTCDate())}/${p(monDate.getUTCMonth() + 1)} - ${p(sunDate.getUTCDate())}/${p(sunDate.getUTCMonth() + 1)}`;
  }
  const m = month - 1 + offset;
  const mStart = new Date(year, m, 1);
  const mEnd = new Date(year, m + 1, 0);
  return `Tháng ${mStart.getMonth() + 1}/${mStart.getFullYear()}`;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-nero/[0.03] p-3 dark:bg-white/[0.04]">
      <p className="text-[11px] font-semibold text-[color:var(--text-muted)]">{label}</p>
      <p className="mt-1 text-lg font-bold tracking-[-0.02em]">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] font-semibold text-[color:var(--text-muted)]">{sub}</p>}
    </div>
  );
}

function DailySpendingChart({ daily, prevDaily = [] }: { daily: any[]; prevDaily?: any[] }) {
  const series = daily.slice(-14);
  const [hoverBar, setHoverBar] = useState(-1);
  const [hoverLine, setHoverLine] = useState(false);
  const [lineIdx, setLineIdx] = useState(-1);
  const [showComparison, setShowComparison] = useState(true);

  if (!series.length) return null;

  const expenses = series.map(d => d.expense || 0);

  // Map previous period by day-of-month for overlay
  const prevByDay: Record<string, number> = {};
  prevDaily.forEach((d: any) => {
    const dayNum = d.date.slice(8); // "DD"
    prevByDay[dayNum] = (prevByDay[dayNum] || 0) + (d.expense || 0);
  });
  const prevExpenses = series.map(d => {
    const dayNum = d.date.slice(8);
    return prevByDay[dayNum] || 0;
  });
  const hasPrev = prevExpenses.some(v => v > 0);
  const max = Math.max(...expenses, ...(hasPrev && showComparison ? prevExpenses : []), 1);
  const avg = expenses.reduce((s, v) => s + v, 0) / Math.max(expenses.length, 1);

  const chartH = 140;
  const labelH = 16;
  const topPad = 18;
  const barAreaH = chartH - labelH - topPad;
  const n = series.length;

  const movingAvg = expenses.map((_, i) => {
    const w = 3;
    const start = Math.max(0, i - Math.floor(w / 2));
    const end = Math.min(expenses.length, i + Math.ceil(w / 2) + 1);
    const slice = expenses.slice(start, end);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });

  function smoothPath(values: number[]): string {
    if (values.length < 2) return '';
    const points = values.map((v, i) => ({
      x: (i / (n - 1)) * 100,
      y: topPad + barAreaH - (v / max) * barAreaH,
    }));
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }

  const barsBlurred = hoverLine;
  const lineBlurred = hoverBar >= 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold">{L.analytics.trend}</h3>
        <div className="flex items-center gap-3">
          {hasPrev && (
            <button
              type="button"
              onClick={() => setShowComparison(!showComparison)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                showComparison
                  ? 'bg-nero/8 text-[color:var(--text-primary)] dark:bg-white/10'
                  : 'text-[color:var(--text-muted)] hover:bg-nero/4 dark:hover:bg-white/4'
              }`}
            >
              So k\u1ef3 tr\u01b0\u1edbc
            </button>
          )}
          <span className="text-[10px] font-semibold text-[color:var(--text-muted)]">
            TB: {formatVNDShort(avg)}
          </span>
        </div>
      </div>
      <div
        className="relative"
        style={{ height: chartH }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const xRatio = x / rect.width;
          const idx = Math.round(xRatio * (n - 1));
          const clampedIdx = Math.max(0, Math.min(n - 1, idx));
          // Compute line Y position in pixels
          const svgH = chartH - labelH;
          const lineY = (topPad + barAreaH - (movingAvg[clampedIdx] / max) * barAreaH) * (rect.height * (svgH / chartH)) / svgH;
          const distToLine = Math.abs(y - lineY);
          if (distToLine < 16) {
            setHoverLine(true);
            setLineIdx(clampedIdx);
            setHoverBar(-1);
          } else {
            setHoverLine(false);
            setLineIdx(-1);
          }
        }}
        onMouseLeave={() => { setHoverBar(-1); setHoverLine(false); setLineIdx(-1); }}
      >
        {/* Bars */}
        <div
          className="absolute inset-0 flex items-end gap-1 transition-all duration-200"
          style={{ paddingTop: topPad, paddingBottom: labelH, opacity: barsBlurred ? 0.25 : 1, filter: barsBlurred ? 'blur(1.5px)' : 'none' }}
        >
          {series.map((item, i) => {
            const val = item.expense || 0;
            const h = Math.max(4, (val / max) * barAreaH);
            const isToday = i === series.length - 1;
            const aboveAvg = val > avg * 1.2;
            const isActive = hoverBar === i;
            const dimmed = hoverBar >= 0 && !isActive;
            return (
              <div
                key={item.date}
                className="flex flex-1 flex-col items-center justify-end h-full cursor-pointer transition-opacity duration-150"
                style={{ opacity: dimmed ? 0.35 : 1 }}
                onMouseEnter={() => { if (!hoverLine) setHoverBar(i); }}
              >
                {val > 0 && (
                  <span className={`text-[7px] font-bold mb-0.5 leading-none transition-all duration-150 ${isActive ? 'text-[color:var(--text-primary)] scale-125' : 'text-[color:var(--text-muted)]'}`}>
                    {formatVNDShort(val)}
                  </span>
                )}
                <div
                  className="w-full rounded-t-md transition-all duration-200"
                  style={{
                    height: h,
                    backgroundColor: isToday
                      ? 'var(--accent)'
                      : aboveAvg
                        ? '#F4845F'
                        : 'var(--chart-muted)',
                    opacity: isActive ? 1 : isToday ? 1 : 0.7,
                    transform: isActive ? 'scaleX(1.15)' : 'scaleX(1)',
                  }}
                />
              </div>
            );
          })}
        </div>
        {/* Trend line (visual only) */}
        {n >= 2 && (
          <svg
            className="absolute inset-0 w-full pointer-events-none transition-all duration-200"
            style={{
              height: chartH - labelH,
              opacity: lineBlurred ? 0.2 : 1,
              filter: lineBlurred ? 'blur(1.5px)' : 'none',
            }}
            viewBox={`0 0 100 ${chartH - labelH}`}
            preserveAspectRatio="none"
          >
            {/* Previous period comparison line */}
            {hasPrev && showComparison && (
              <path
                d={smoothPath(prevExpenses)}
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
                opacity="0.4"
              />
            )}
            <path
              d={smoothPath(movingAvg)}
              fill="none"
              stroke="#4D96FF"
              strokeWidth={hoverLine ? '2.5' : '1.5'}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="transition-all duration-200"
            />
            {hoverLine && lineIdx >= 0 && (() => {
              const cx = (lineIdx / (n - 1)) * 100;
              const cy = topPad + barAreaH - (movingAvg[lineIdx] / max) * barAreaH;
              return (
                <circle cx={cx} cy={cy} r="4" fill="#4D96FF" stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              );
            })()}
          </svg>
        )}
        {/* Trend line hover tooltip */}
        {hoverLine && lineIdx >= 0 && n >= 2 && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${(lineIdx / (n - 1)) * 100}%`,
              top: topPad + barAreaH - (movingAvg[lineIdx] / max) * barAreaH - 22,
              transform: 'translateX(-50%)',
            }}
          >
            <span className="rounded-md bg-sky px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm whitespace-nowrap">
              {formatVNDShort(Math.round(movingAvg[lineIdx]))}
            </span>
          </div>
        )}
        {/* Date labels */}
        <div className="absolute bottom-0 left-0 right-0 flex gap-1 pointer-events-none" style={{ height: labelH }}>
          {series.map((item, i) => (
            <span
              key={item.date}
              className={`flex-1 text-center text-[8px] font-semibold transition-colors duration-150 ${hoverBar === i ? 'text-[color:var(--text-primary)]' : 'text-[color:var(--text-muted)]'}`}
            >
              {item.date.slice(8)}
            </span>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-[color:var(--text-muted)]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-3 bg-coral/50 rounded-full" />
          Trên TB
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: 'var(--chart-muted)' }} />
          Bình thường
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-3 rounded-full bg-sky" />
          Xu hướng
        </span>
        {hasPrev && showComparison && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-3 rounded-full border-t border-dashed border-[color:var(--text-muted)]" />
            Kỳ trước
          </span>
        )}
      </div>
    </div>
  );
}

function TopCategoriesSection({
  cats,
  total,
  onSelect,
}: {
  cats: any[];
  total: number;
  onSelect: (cat: string) => void;
}) {
  if (!cats.length) return null;

  return (
    <div>
      <h3 className="mb-3 text-xs font-bold">{L.analytics.topCategories}</h3>
      <div className="space-y-3">
        {cats.slice(0, 5).map((cat) => {
          const meta = getCategoryByKey(cat.category);
          const pct = total > 0 ? Math.round((cat.total / total) * 100) : 0;
          return (
            <button
              key={cat.category}
              type="button"
              onClick={() => onSelect(cat.category)}
              className="w-full text-left active:scale-[0.99] transition-transform"
            >
              <div className="mb-1.5 flex items-center gap-3">
                <CategoryIcon category={cat.category} size={28} />
                <span className="flex-1 text-sm font-bold">{meta?.label || cat.category}</span>
                <span className="text-xs font-bold">{formatVNDShort(cat.total)}</span>
                <span className="ml-1 text-[11px] font-semibold text-[color:var(--text-muted)]">{pct}%</span>
              </div>
              <Progress value={cat.total} max={total} height={4} accent={meta?.color || 'var(--accent)'} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SpendingPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { chartType } = useTheme();
  const [range, setRange] = useState('month');
  const [offset, setOffset] = useState(0);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [drillCategory, setDrillCategory] = useState<string | null>(null);

  const handleRangeChange = (r: string) => { setRange(r); setOffset(0); };

  const { data: summary, isLoading, mutate: mutateSummary } = useSWR(
    `/api/transactions/summary?month=${month}&year=${year}&range=${range}&offset=${offset}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const selectedRange = getClientDateRange(range, month, year, offset);
  const categoryBreakdownTotal = (summary?.categoryBreakdown || []).reduce((s: number, i: any) => s + i.total, 0);
  const selectedCategorySummaryRaw = summary?.categoryBreakdown?.find((item: any) => item.category === selectedCategory);
  const selectedCategorySummary = selectedCategorySummaryRaw
    ? {
      ...selectedCategorySummaryRaw,
      percentage: categoryBreakdownTotal > 0 ? Math.round((selectedCategorySummaryRaw.total / categoryBreakdownTotal) * 100) : 0,
    }
    : undefined;

  const categoryTxParams = new URLSearchParams({
    limit: '100',
    category: selectedCategory || '',
    type: 'expense',
    startDate: selectedRange.startDate,
    endDate: selectedRange.endDate,
  });
  const {
    data: categoryTransactions,
    isLoading: categoryTransactionsLoading,
    mutate: mutateCategoryTransactions,
  } = useSWR(selectedCategory ? `/api/transactions?${categoryTxParams}` : null, fetcher, { refreshInterval: 30000 });

  // Donut drill-down fetch
  const drillTxParams = new URLSearchParams({
    limit: '100',
    category: drillCategory || '',
    type: 'expense',
    startDate: selectedRange.startDate,
    endDate: selectedRange.endDate,
  });
  const { data: drillTransactions, isLoading: drillLoading } = useSWR(
    drillCategory ? `/api/transactions?${drillTxParams}` : null, fetcher
  );

  const loading = isLoading || !summary;
  const totalExpense = summary?.totalExpense || 0;
  const avgDaily = summary?.avgDailySpending || 0;
  const txCount = (summary?.categoryBreakdown || []).reduce((s: number, c: any) => s + (c.count || 0), 0);
  const dailyAllowance = summary?.dailyAllowance || 0;
  const spendingChange = summary?.spendingChange;

  return (
    <PageShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-[-0.04em]">{L.analytics.title}</h1>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Segmented options={RANGES} value={range} onChange={handleRangeChange} className="flex-1" />
        <div
          className="inline-flex items-center gap-1 rounded-full py-1.5 px-1.5 shrink-0"
          style={{
            background: 'var(--surface-soft)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06), 0 1px 1px rgba(255,255,255,0.7)',
          }}
        >
          <button
            type="button"
            onClick={() => setOffset(offset - 1)}
            className="flex h-6 w-6 items-center justify-center rounded-full transition-all active:scale-90 hover:scale-110 hover:shadow-md"
            style={{
              background: 'var(--surface-card)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 1px rgba(0,0,0,0.04)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span className="text-[10px] font-bold px-1.5 min-w-0 select-none whitespace-nowrap">
            {getDateRangeLabel(range, month, year, offset)}
          </span>
          <button
            type="button"
            onClick={() => setOffset(offset + 1)}
            disabled={offset >= 0}
            className="flex h-6 w-6 items-center justify-center rounded-full transition-all active:scale-90 hover:scale-110 hover:shadow-md disabled:opacity-25 disabled:pointer-events-none"
            style={{
              background: 'var(--surface-card)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 1px rgba(0,0,0,0.04)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-brutal h-28 animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-yolk/10 to-transparent" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* ─── Overview Stats ─── */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard
              label={L.analytics.totalSpending}
              value={formatVNDShort(totalExpense)}
              sub={spendingChange !== null
                ? `${spendingChange > 0 ? '+' : ''}${spendingChange}%`
                : undefined}
            />
            <StatCard
              label={L.analytics.avgDailySpending}
              value={formatVNDShort(avgDaily)}
              sub={dailyAllowance > 0 ? `/${formatVNDShort(dailyAllowance)}` : undefined}
            />
            <StatCard
              label={L.analytics.totalTransactions}
              value={String(txCount)}
            />
          </div>

          {/* ─── Daily Spending Trend ─── */}
          {(summary?.dailySpending?.length || 0) > 0 && (
            <Card>
              <DailySpendingChart daily={summary.dailySpending} prevDaily={summary.prevDailySpending} />
            </Card>
          )}

          {/* ─── Category Chart ─── */}
          <Card>
            <h3 className="mb-4 text-xs font-bold">{L.analytics.categories}</h3>
            <CategoryAnalytics
              cats={summary.categoryBreakdown || []}
              daily={summary.dailySpending || []}
              chartType={chartType}
              onSelectCategory={setSelectedCategory}
              onDrillCategory={setDrillCategory}
              drillTransactions={drillTransactions?.data}
              drillLoading={drillLoading}
            />
          </Card>

          {/* ─── Top Categories Breakdown ─── */}
          <Card>
            <TopCategoriesSection
              cats={summary.categoryBreakdown || []}
              total={totalExpense}
              onSelect={setSelectedCategory}
            />
          </Card>
        </div>
      )}

      <TransactionDetail
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onUpdated={(tx) => {
          setSelectedTx(tx);
          mutateSummary();
          mutateCategoryTransactions();
        }}
        onDeleted={() => {
          setSelectedTx(null);
          mutateSummary();
          mutateCategoryTransactions();
        }}
      />

      <CategoryDrilldownSheet
        open={!!selectedCategory}
        categoryKey={selectedCategory}
        summary={selectedCategorySummary}
        transactions={categoryTransactions?.data || []}
        loading={categoryTransactionsLoading}
        onClose={() => setSelectedCategory(null)}
        onSelectTransaction={setSelectedTx}
      />
    </PageShell>
  );
}
