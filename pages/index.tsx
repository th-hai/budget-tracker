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

function getSpendingLabel(range: string) {
  if (range === 'today') return L.spending.todayTitle;
  if (range === 'week') return L.spending.weekTitle;
  return L.spending.monthTitle;
}

function SpendingTrend({ change }: { change: number | null }) {
  if (change === null) return (
    <span className="text-[11px] font-semibold text-[color:var(--text-muted)]">
      {L.spending.noComparison}
    </span>
  );

  const isDown = change < 0;
  const isZero = change === 0;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${isZero ? 'text-[color:var(--text-muted)]' : isDown ? 'text-teal' : 'text-coral'}`}>
      {!isZero && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={isDown ? '' : 'rotate-180'}>
          <path d="M5 2L2 7h6L5 2z" fill="currentColor" />
        </svg>
      )}
      {L.spending.vsLastPeriod(change)}
    </span>
  );
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

function getInsightMessage(summary: any, range: string): string {
  if (!summary) return '';
  const { spendingChange, dailyAllowance, avgDailySpending, budgetGoal } = summary;

  if (range === 'today') {
    if (budgetGoal && avgDailySpending > 0) {
      const todaySpent = summary.totalExpense;
      if (todaySpent <= dailyAllowance * 0.7) return L.insights.spendingLow;
      if (todaySpent <= dailyAllowance) return L.insights.spendingNormal;
      return L.insights.spendingHigh;
    }
    return '';
  }

  if (spendingChange !== null) {
    if (spendingChange < -5) return L.insights.spendingLow;
    if (spendingChange <= 5) return L.insights.spendingNormal;
    return L.insights.spendingHigh;
  }

  return '';
}

export default function Dashboard() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { chartType, dark, setDark } = useTheme();
  const [range, setRange] = useState('today');
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
  const budgetPct = budgetGoal > 0 ? Math.round((summary?.totalExpense / budgetGoal) * 100) : 0;
  const dailyAllowance = summary?.dailyAllowance || 0;
  const daysLeft = summary?.daysLeft || 1;
  const avgDaily = summary?.avgDailySpending || 0;
  const savingGoal = summary?.savingGoal || 0;
  const actualSaving = summary?.actualSaving || 0;
  const savingPct = savingGoal > 0 ? Math.round((actualSaving / savingGoal) * 100) : 0;
  const insight = getInsightMessage(summary, range);

  return (
    <PageShell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold text-[color:var(--text-muted)]">Tháng {month}/{year}</p>
          <h1 className="text-3xl font-bold tracking-[-0.04em]">{L.dashboard.title}</h1>
        </div>
        <button
          type="button"
          onClick={() => setDark(!dark)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-nero/50 transition-colors hover:text-nero/80 active:scale-95 dark:text-cream/50 dark:hover:text-cream/80"
          aria-label="Toggle dark mode"
        >
          {dark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      <Segmented options={RANGES} value={range} onChange={setRange} className="mb-4" />

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard height="h-36" />
          <SkeletonCard height="h-24" />
          <SkeletonCard height="h-24" />
          <SkeletonCard height="h-72" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* ─── Spending Hero ─── */}
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-coral/8" />
            <p className="mb-1 text-xs font-bold text-[color:var(--text-muted)]">{getSpendingLabel(range)}</p>
            <p className="text-[40px] font-bold leading-none tracking-[-0.06em] text-coral">
              -{formatVND(summary.totalExpense)}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <SpendingTrend change={summary.spendingChange} />
            </div>
            {insight && (
              <p className="mt-2 text-[11px] font-semibold text-[color:var(--text-muted)]">{insight}</p>
            )}
            {(summary.totalIncome > 0 || summary.totalExpense > 0) && (
              <div className="mt-4 flex gap-3 border-t border-nero/8 pt-3 dark:border-white/8">
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
            )}
          </Card>

          {/* ─── Daily Allowance ─── */}
          {range === 'month' && (
            <Card>
              {budgetGoal ? (
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal/10">
                    <span className="text-lg font-black text-teal">{formatVNDShort(dailyAllowance)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{L.allowance.title}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[color:var(--text-muted)]">
                      {avgDaily > 0 && <>{L.allowance.avgDaily}: {formatVNDShort(avgDaily)} · </>}
                      {L.allowance.daysLeft(daysLeft)}
                    </p>
                    <p className={`mt-1 text-[11px] font-bold ${
                      avgDaily <= dailyAllowance ? 'text-teal' : 'text-coral'
                    }`}>
                      {avgDaily <= dailyAllowance ? L.allowance.safe : L.allowance.overPace}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{L.allowance.title}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[color:var(--text-muted)]">{L.allowance.noBudget}</p>
                  </div>
                  <Link href="/settings" className="text-xs font-bold text-teal">{L.budget.emptyAction}</Link>
                </div>
              )}
            </Card>
          )}

          {/* ─── Budget Progress ─── */}
          {range === 'month' && budgetGoal > 0 && (
            <Card>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-bold">{L.budget.title}</h2>
                <span className={`text-xs font-bold ${budgetPct > 100 ? 'text-danger' : budgetPct >= 70 ? 'text-amber-deep' : 'text-teal'}`}>
                  {budgetPct}%
                </span>
              </div>
              <Progress value={summary.totalExpense} max={budgetGoal} />
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-[11px] font-semibold text-[color:var(--text-muted)]">
                  {L.budget.used}: {formatVNDShort(summary.totalExpense)}
                </span>
                <span className={`text-[11px] font-bold ${remaining < 0 ? 'text-danger' : 'text-[color:var(--text-muted)]'}`}>
                  {L.budget.remaining}: {formatVNDShort(Math.abs(remaining))}
                </span>
              </div>
              <p className={`mt-2 text-[11px] font-semibold ${remaining < 0 ? 'text-danger' : 'text-[color:var(--text-muted)]'}`}>
                {remaining < 0
                  ? L.budget.overBudget(formatVNDShort(Math.abs(remaining)))
                  : L.budget.onTrack(formatVNDShort(dailyAllowance))}
              </p>
            </Card>
          )}

          {/* ─── Savings Progress ─── */}
          {range === 'month' && savingGoal > 0 && (
            <Card>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-bold">{L.savings.title}</h2>
                <span className={`text-xs font-bold ${savingPct >= 100 ? 'text-teal' : 'text-[color:var(--text-muted)]'}`}>
                  {Math.max(0, savingPct)}%
                </span>
              </div>
              <Progress value={actualSaving} max={savingGoal} accent="#7EC8A0" />
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-[11px] font-semibold text-[color:var(--text-muted)]">
                  {formatVNDShort(actualSaving)} / {formatVNDShort(savingGoal)}
                </span>
              </div>
              <p className="mt-2 text-center text-[11px] font-semibold text-[color:var(--text-muted)]">
                {actualSaving >= savingGoal
                  ? L.savings.achieved(formatVNDShort(actualSaving - savingGoal))
                  : savingPct >= 80
                    ? L.savings.nearGoal(formatVNDShort(savingGoal - actualSaving))
                    : L.savings.inProgress(formatVNDShort(savingGoal - actualSaving))}
              </p>
            </Card>
          )}

          {/* ─── Category Analytics ─── */}
          <Card>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-sm font-bold">{L.dashboard.chartCategory}</h2>
              <Link href="/spending" className="text-xs font-bold text-teal">{L.dashboard.recentViewAll}</Link>
            </div>
            <CategoryAnalytics
              cats={summary.categoryBreakdown || []}
              daily={summary.dailySpending || []}
              chartType={chartType}
              onSelectCategory={setSelectedCategory}
            />
          </Card>

          {/* ─── Recent Transactions ─── */}
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
