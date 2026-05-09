import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatVNDShort } from '@/lib/format';
import { L } from '@/lib/labels';

interface BudgetProgressCardProps {
  totalExpense: number;
  budgetGoal: number | null;
}

export default function BudgetProgressCard({ totalExpense, budgetGoal }: BudgetProgressCardProps) {
  if (!budgetGoal) {
    return (
      <Card className="text-center py-8">
        <p className="text-2xl opacity-15 mb-2">🎯</p>
        <p className="text-sm font-semibold opacity-35 mb-1">{L.budget.emptyTitle}</p>
        <a href="/settings" className="text-sm font-bold text-teal hover:opacity-70 transition-opacity">{L.budget.emptyAction}</a>
      </Card>
    );
  }

  const percentage = Math.round((totalExpense / budgetGoal) * 100);
  const remaining = budgetGoal - totalExpense;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = daysInMonth - dayOfMonth + 1;
  const dailyAllowance = remaining > 0 ? Math.round(remaining / daysLeft) : 0;

  const expectedPct = Math.round((dayOfMonth / daysInMonth) * 100);
  const isOnTrack = percentage <= expectedPct + 5;

  function getInsight() {
    if (remaining < 0) return L.budget.overBudget(formatVNDShort(Math.abs(remaining)));
    if (percentage >= 90) return L.budget.nearLimit(formatVNDShort(remaining));
    if (isOnTrack) return L.budget.onTrack(formatVNDShort(dailyAllowance));
    return L.budget.offTrack(formatVNDShort(dailyAllowance));
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-3 right-3 text-2xl opacity-10">🎯</div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[11px] font-semibold opacity-40 mb-0.5">{L.budget.label}</p>
          <p className="text-lg font-bold">{formatVNDShort(budgetGoal)}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold opacity-40 mb-0.5">{L.budget.remaining}</p>
          <p className={`text-lg font-bold ${remaining >= 0 ? 'text-teal' : 'text-coral'}`}>
            {remaining >= 0 ? '' : '-'}{formatVNDShort(Math.abs(remaining))}
          </p>
        </div>
      </div>
      <ProgressBar value={percentage} sublabel={`${percentage}%`} />
      <p className={`text-xs font-medium mt-2.5 text-center ${remaining < 0 ? 'text-coral font-bold' : 'opacity-40'}`}>
        {getInsight()}
      </p>
    </Card>
  );
}
