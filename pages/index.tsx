import { useState } from 'react';
import useSWR from 'swr';
import fetcher from '@/lib/api';
import { formatVND, formatVNDShort, formatDateSmart, formatTime } from '@/lib/format';
import PageShell from '@/components/layout/PageShell';
import Card from '@/components/ui/Card';
import Segmented from '@/components/ui/Segmented';
import Progress from '@/components/ui/Progress';
import CategoryIcon from '@/components/ui/CategoryIcon';
import CategoryAnalytics from '@/components/charts/CategoryAnalytics';
import CategoryDrilldownSheet from '@/components/charts/CategoryDrilldownSheet';
import TransactionDetail from '@/components/transaction/TransactionDetail';
import LogoMark from '@/components/LogoMark';
import Link from 'next/link';
import { L } from '@/lib/labels';
import { useTheme } from '@/lib/theme';
import { getCategoryByKey } from '@/lib/categories';

const RANGES = [
  { key: 'today', label: L.dashboard.filterToday },
  { key: 'week', label: L.dashboard.filterWeek },
  { key: 'month', label: L.dashboard.filterMonth },
];

function SkeletonCard({ height = 'h-28' }: { height?: string }) {
  return (
    <div className={`card-brutal ${height} relative overflow-hidden animate-pulse`}>
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-yolk/10 to-transparent" />
    </div>
  );
}

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getClientDateRange(range: string, month: number, year: number) {
  const now = new Date();
  if (range === 'today') return { startDate: toDateInputValue(now), endDate: toDateInputValue(now) };
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

function getRangeBalanceLabel(range: string) {
  if (range === 'today') return L.dashboard.balanceToday;
  if (range === 'week') return L.dashboard.balanceWeek;
  return L.dashboard.balanceMonth;
}

function TransactionRow({ tx, onClick }: { tx: any; onClick: () => void }) {
  const cat = getCategoryByKey(tx.category);
  const isPositive = tx.type === 'income' || tx.category === 'saving';

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition-all duration-150 active:scale-[0.98] hover:bg-nero/[0.03] dark:hover:bg-white/[0.04]"
    >
      <CategoryIcon category={tx.category} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{tx.note || cat?.label || 'Giao dịch'}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-[color:var(--text-muted)]">
          {cat?.label || tx.category} · {formatTime(tx.transactionDate)}
        </p>
      </div>
      <span className={`shrink-0 text-sm font-bold ${isPositive ? 'text-teal' : 'text-coral'}`}>
        {isPositive ? '+' : '-'}{formatVNDShort(tx.amount)}
      </span>
    </button>
  );
}

export default function Dashboard() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { chartType } = useTheme();
  const [range, setRange] = useState('month');
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: summary, isLoading: summaryLoading, mutate: mutateSummary } = useSWR(
    `/api/transactions/summary?month=${month}&year=${year}&range=${range}`,
    fetcher,
    { refreshInterval: 30000 }
  );
  const { data: recent, mutate: mutateRecent } = useSWR(
    `/api/transactions?limit=5&month=${month}&year=${year}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const categoryBreakdownTotal = (summary?.categoryBreakdown || []).reduce((sum: number, item: any) => sum + item.total, 0);
  const selectedCategorySummaryRaw = summary?.categoryBreakdown?.find((item: any) => item.category === selectedCategory);
  const selectedCategorySummary = selectedCategorySummaryRaw
    ? {
      ...selectedCategorySummaryRaw,
      percentage: categoryBreakdownTotal > 0 ? Math.round((selectedCategorySummaryRaw.total / categoryBreakdownTotal) * 100) : 0,
    }
    : undefined;
  const selectedRange = getClientDateRange(range, month, year);
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

  const loading = summaryLoading || !summary;
  const recentGrouped = (() => {
    if (!recent?.data?.length) return [];
    const groups: Record<string, any[]> = {};
    recent.data.forEach((tx: any) => {
      const dateKey = new Date(tx.transactionDate).toISOString().split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  })();

  const budgetGoal = summary?.budgetGoal || 0;
  const remaining = budgetGoal - (summary?.totalExpense || 0);
  const budgetPct = budgetGoal > 0 ? Math.round((summary.totalExpense / budgetGoal) * 100) : 0;
  const daysLeft = new Date(year, month, 0).getDate() - now.getDate() + 1;
  const dailyAllowance = remaining > 0 ? Math.round(remaining / Math.max(daysLeft, 1)) : 0;

  return (
    <PageShell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold text-[color:var(--text-muted)]">Tháng {month}/{year}</p>
          <h1 className="text-3xl font-bold tracking-[-0.04em]">{L.dashboard.title}</h1>
        </div>
        <LogoMark size={34} />
      </div>

      <Segmented options={RANGES} value={range} onChange={setRange} className="mb-4" />

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard height="h-44" />
          <SkeletonCard height="h-32" />
          <SkeletonCard height="h-72" />
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-teal/10" />
            <p className="mb-1 text-sm font-bold text-[color:var(--text-muted)]">{getRangeBalanceLabel(range)}</p>
            <p className={`text-[42px] font-bold leading-none tracking-[-0.06em] ${summary.balance >= 0 ? 'text-teal' : 'text-coral'}`}>
              {summary.balance >= 0 ? '+' : '-'}{formatVND(Math.abs(summary.balance))}
            </p>
            <p className="mt-3 text-xs font-semibold text-[color:var(--text-muted)]">
              {budgetGoal ? (
                <>Còn lại <b className="text-[color:var(--text-primary)]">{formatVNDShort(Math.max(remaining, 0))}</b> · ≈ <b className="text-[color:var(--text-primary)]">{formatVNDShort(dailyAllowance)}</b>/ngày</>
              ) : (
                L.budget.emptyTitle
              )}
            </p>
            <div className="mt-5 flex gap-3 border-t border-nero/8 pt-4 dark:border-white/8">
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-[color:var(--text-muted)]">{L.dashboard.income}</p>
                <p className="text-sm font-bold text-teal">+{formatVNDShort(summary.totalIncome)}</p>
              </div>
              <div className="w-px bg-nero/8 dark:bg-white/8" />
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-[color:var(--text-muted)]">{L.dashboard.expense}</p>
                <p className="text-sm font-bold text-coral">-{formatVNDShort(summary.totalExpense)}</p>
              </div>
            </div>
          </Card>

          {range === 'month' && (
            <Card>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-bold">{L.settings.budgetTitle}</h2>
                <span className={`text-xs font-bold ${budgetPct > 100 ? 'text-danger' : budgetPct >= 70 ? 'text-amber-deep' : 'text-teal'}`}>
                  {budgetGoal ? `${budgetPct}%` : '0%'}
                </span>
              </div>
              {budgetGoal ? (
                <>
                  <Progress value={summary.totalExpense} max={budgetGoal} />
                  <p className={`mt-3 text-xs font-semibold ${remaining < 0 ? 'text-danger' : 'text-[color:var(--text-muted)]'}`}>
                    {remaining < 0
                      ? L.budget.overBudget(formatVNDShort(Math.abs(remaining)))
                      : L.budget.onTrack(formatVNDShort(dailyAllowance))}
                  </p>
                </>
              ) : (
                <Link href="/settings" className="text-sm font-bold text-teal">{L.budget.emptyAction}</Link>
              )}
            </Card>
          )}

          <Card>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-sm font-bold">{L.dashboard.chartCategory}</h2>
              <Link href="/transactions" className="text-xs font-bold text-teal">{L.dashboard.recentViewAll}</Link>
            </div>
            <CategoryAnalytics
              cats={summary.categoryBreakdown || []}
              daily={summary.dailySpending || []}
              chartType={chartType}
              onSelectCategory={setSelectedCategory}
            />
          </Card>

          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-bold">{L.dashboard.recentTitle}</h2>
              <Link href="/transactions" className="text-xs font-bold text-teal">{L.dashboard.recentViewAll}</Link>
            </div>
            {recentGrouped.length > 0 ? (
              <div className="space-y-3">
                {recentGrouped.map(([date, txs]) => (
                  <div key={date}>
                    <p className="mb-1.5 px-1 text-[11px] font-bold text-[color:var(--text-muted)]">{formatDateSmart(date)}</p>
                    <Card density="compact" className="p-2">
                      {txs.map((tx: any, i: number) => (
                        <div key={tx._id}>
                          {i > 0 && <div className="mx-2 border-t border-nero/6 dark:border-white/8" />}
                          <TransactionRow tx={tx} onClick={() => setSelectedTx(tx)} />
                        </div>
                      ))}
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <div className="py-8 text-center">
                  <p className="mb-2 text-2xl opacity-20">📋</p>
                  <p className="text-sm font-semibold text-[color:var(--text-muted)]">{L.dashboard.emptyTransactions}</p>
                  <p className="mt-0.5 text-xs font-medium opacity-30">{L.dashboard.emptyTransactionsHint}</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      <TransactionDetail
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onUpdated={(tx) => {
          setSelectedTx(tx);
          mutateSummary();
          mutateRecent();
          mutateCategoryTransactions();
        }}
        onDeleted={() => {
          setSelectedTx(null);
          mutateSummary();
          mutateRecent();
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
