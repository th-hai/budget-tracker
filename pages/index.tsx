import { useState } from 'react';
import useSWR from 'swr';
import fetcher from '@/lib/api';
import { formatVND, formatVNDShort, formatDateSmart } from '@/lib/format';
import PageShell from '@/components/layout/PageShell';
import Card from '@/components/ui/Card';
import BudgetProgressCard from '@/components/charts/BudgetProgressCard';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import SpendingLineChart from '@/components/charts/SpendingLineChart';
import TransactionCard from '@/components/transaction/TransactionCard';
import TransactionDetail from '@/components/transaction/TransactionDetail';
import Link from 'next/link';
import { L } from '@/lib/labels';

const RANGES = [
  { key: 'today', label: L.dashboard.filterToday },
  { key: 'week', label: L.dashboard.filterWeek },
  { key: 'month', label: L.dashboard.filterMonth },
];

function SkeletonCard({ height = 'h-20' }: { height?: string }) {
  return (
    <div className={`card-brutal ${height} animate-pulse overflow-hidden relative`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yolk/10 to-transparent animate-shimmer" />
    </div>
  );
}

function getBalanceAccent(balance: number, budgetGoal: number | null, totalExpense: number) {
  if (balance < 0) return { bg: 'bg-coral/8', text: 'text-coral', icon: '📉' };
  if (budgetGoal && totalExpense > budgetGoal * 0.8) return { bg: 'bg-amber/8', text: 'text-amber', icon: '⚠️' };
  return { bg: 'bg-teal/8', text: 'text-teal', icon: '💰' };
}

function getRangeLabel(range: string) {
  if (range === 'today') return L.dashboard.balanceToday.replace('Số dư ', '');
  if (range === 'week') return L.dashboard.balanceWeek.replace('Số dư ', '');
  return L.dashboard.balanceMonth.replace('Số dư ', '');
}

export default function Dashboard() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const [range, setRange] = useState('month');
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const { data: summary, isLoading: summaryLoading } = useSWR(
    `/api/transactions/summary?month=${month}&year=${year}&range=${range}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: recent } = useSWR(
    `/api/transactions?limit=5&month=${month}&year=${year}`,
    fetcher,
    { refreshInterval: 30000 }
  );

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

  const accent = !loading
    ? getBalanceAccent(summary.balance, summary.budgetGoal, summary.totalExpense)
    : { bg: '', text: '', icon: '' };

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] font-semibold opacity-30 mb-0.5">
          Tháng {month}/{year}
        </p>
        <h1 className="text-2xl font-bold mb-4">{L.dashboard.title}</h1>

        <div className="flex gap-1.5 bg-nero/5 p-1 rounded-xl">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                range === r.key
                  ? 'bg-white text-nero shadow-sm'
                  : 'text-nero/40 hover:text-nero/60'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard height="h-36" />
          <SkeletonCard height="h-32" />
          <SkeletonCard height="h-48" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Balance hero + income/expense */}
          <Card className={`relative overflow-hidden ${accent.bg}`}>
            <div className="absolute top-4 right-4 text-3xl opacity-10">{accent.icon}</div>
            <p className="text-[11px] font-semibold opacity-40 mb-2">
              {L.dashboard.balanceLabel} {getRangeLabel(range)}
            </p>
            <p className={`text-3xl font-bold tracking-tight ${accent.text}`}>
              {summary.balance >= 0 ? '+' : ''}{formatVND(summary.balance)}
            </p>

            {/* Income / Expense row */}
            <div className="flex gap-3 mt-4 pt-3 border-t border-nero/6">
              <div className="flex-1">
                <p className="text-[11px] font-semibold opacity-35 mb-0.5">{L.dashboard.income}</p>
                <p className="text-sm font-bold text-teal">+{formatVNDShort(summary.totalIncome)}</p>
              </div>
              <div className="w-px bg-nero/6" />
              <div className="flex-1">
                <p className="text-[11px] font-semibold opacity-35 mb-0.5">{L.dashboard.expense}</p>
                <p className="text-sm font-bold text-coral">-{formatVNDShort(summary.totalExpense)}</p>
              </div>
            </div>
          </Card>

          {/* Budget progress */}
          {range === 'month' && (
            <BudgetProgressCard totalExpense={summary.totalExpense} budgetGoal={summary.budgetGoal} />
          )}

          {/* Spending chart */}
          {range !== 'today' && (
            <Card>
              <h2 className="text-sm font-bold mb-4">{L.dashboard.chartDaily}</h2>
              <SpendingLineChart data={summary.dailySpending || []} />
            </Card>
          )}

          {/* Category breakdown */}
          <Card>
            <h2 className="text-sm font-bold mb-4">{L.dashboard.chartCategory}</h2>
            <CategoryPieChart data={summary.categoryBreakdown || []} />
          </Card>

          {/* Recent transactions */}
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <h2 className="text-sm font-bold">{L.dashboard.recentTitle}</h2>
              <Link href="/transactions" className="text-xs font-bold text-teal hover:opacity-70 transition-opacity">
                {L.dashboard.recentViewAll}
              </Link>
            </div>

            {recentGrouped.length > 0 ? (
              <div className="space-y-3">
                {recentGrouped.map(([date, txs]) => (
                  <div key={date}>
                    <p className="text-[11px] font-bold opacity-30 mb-1.5 px-1">
                      {formatDateSmart(date)}
                    </p>
                    <Card>
                      {txs.map((tx: any, i: number) => (
                        <div key={tx._id}>
                          {i > 0 && <div className="border-t border-nero/5 mx-2" />}
                          <TransactionCard
                            transaction={tx}
                            onClick={() => setSelectedTx(tx)}
                          />
                        </div>
                      ))}
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <p className="text-2xl opacity-15 mb-2">📋</p>
                  <p className="text-sm font-semibold opacity-30">{L.dashboard.emptyTransactions}</p>
                  <p className="text-xs font-medium opacity-20 mt-0.5">{L.dashboard.emptyTransactionsHint}</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      <TransactionDetail
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </PageShell>
  );
}
