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

function getClientDateRange(range: string, month: number, year: number) {
  const now = new Date();
  if (range === 'week') {
    const day = now.getDay();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return { startDate: toDateInputValue(monday), endDate: toDateInputValue(sunday) };
  }
  return {
    startDate: toDateInputValue(new Date(year, month - 1, 1)),
    endDate: toDateInputValue(new Date(year, month, 0)),
  };
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

function DailySpendingChart({ daily }: { daily: any[] }) {
  const series = daily.slice(-14);
  if (!series.length) return null;

  const expenses = series.map(d => d.expense || 0);
  const max = Math.max(...expenses, 1);
  const avg = expenses.reduce((s, v) => s + v, 0) / Math.max(expenses.length, 1);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-xs font-bold">{L.analytics.trend}</h3>
        <span className="text-[10px] font-semibold text-[color:var(--text-muted)]">
          TB: {formatVNDShort(avg)}
        </span>
      </div>
      <div className="flex h-[120px] items-end gap-1">
        {series.map((item, i) => {
          const val = item.expense || 0;
          const h = Math.max(4, (val / max) * 100);
          const isToday = i === series.length - 1;
          const aboveAvg = val > avg * 1.2;
          return (
            <div key={item.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md transition-all duration-300"
                style={{
                  height: h,
                  backgroundColor: isToday
                    ? 'var(--accent)'
                    : aboveAvg
                      ? '#F4845F'
                      : 'var(--chart-muted)',
                  opacity: isToday ? 1 : 0.7,
                }}
              />
              <span className="text-[8px] font-semibold text-[color:var(--text-muted)]">
                {item.date.slice(8)}
              </span>
            </div>
          );
        })}
      </div>
      {/* Average line indicator */}
      <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold text-[color:var(--text-muted)]">
        <span className="inline-block h-0.5 w-3 bg-coral/50" />
        Trên trung bình
        <span className="inline-block h-0.5 w-3 rounded-sm" style={{ backgroundColor: 'var(--chart-muted)' }} />
        Bình thường
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
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: summary, isLoading, mutate: mutateSummary } = useSWR(
    `/api/transactions/summary?month=${month}&year=${year}&range=${range}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const selectedRange = getClientDateRange(range, month, year);
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

      <Segmented options={RANGES} value={range} onChange={setRange} className="mb-4" />

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
              <DailySpendingChart daily={summary.dailySpending} />
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
