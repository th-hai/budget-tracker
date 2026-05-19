import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import BudgetGoal from '@/models/BudgetGoal';

// Vietnam timezone offset: UTC+7
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

// Get current time in Vietnam
function nowVN() {
  const now = new Date();
  return new Date(now.getTime() + VN_OFFSET_MS);
}

// Create a UTC date that corresponds to midnight VN time on a given VN date
function vnMidnightUTC(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d) - VN_OFFSET_MS);
}

function getDateRange(range: string, month: number, year: number, offset: number = 0) {
  const vn = nowVN();
  const vY = vn.getUTCFullYear(), vM = vn.getUTCMonth(), vD = vn.getUTCDate();

  if (range === 'today') {
    const d = vD + offset;
    const start = vnMidnightUTC(vY, vM, d);
    const end = new Date(vnMidnightUTC(vY, vM, d + 1).getTime() - 1);
    return { start, end };
  }

  if (range === 'week') {
    const day = vn.getUTCDay(); // 0=Sun
    const mondayD = vD - ((day + 6) % 7) + offset * 7;
    const start = vnMidnightUTC(vY, vM, mondayD);
    const end = new Date(vnMidnightUTC(vY, vM, mondayD + 7).getTime() - 1);
    return { start, end };
  }

  // Default: month
  const m = month - 1 + offset;
  const start = vnMidnightUTC(year, m, 1);
  const end = new Date(vnMidnightUTC(year, m + 1, 1).getTime() - 1);
  return { start, end };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await connectDB();

  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  const range = (req.query.range as string) || 'month';
  const offset = Number(req.query.offset) || 0;

  const { start, end } = getDateRange(range, month, year, offset);

  const dateFilter = {
    transactionDate: { $gte: start, $lte: end },
    categorized: true,
  };

  // Exclude saving from totals/daily (not real spending), but include in category breakdown (pie chart)
  const noSavingFilter = { ...dateFilter, category: { $ne: 'saving' } };

  // Calculate previous period for comparison
  function getPrevPeriod(r: string, m: number, y: number, off: number) {
    return getDateRange(r, m, y, off - 1);
  }

  const prev = getPrevPeriod(range, month, year, offset);
  const prevFilter = {
    transactionDate: { $gte: prev.start, $lte: prev.end },
    categorized: true,
    category: { $ne: 'saving' },
  };

  // Previous period daily spending (for month-over-month comparison)
  const prevDailyFilter = {
    transactionDate: { $gte: prev.start, $lte: prev.end },
    categorized: true,
    category: { $ne: 'saving' },
  };

  const [totals, categoryBreakdown, dailySpending, budgetGoal, savingTotal, prevTotals, prevDailySpending] =
    await Promise.all([
      Transaction.aggregate([
        { $match: noSavingFilter },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),
      Transaction.aggregate([
        { $match: { ...dateFilter, type: 'expense' } },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
      Transaction.aggregate([
        { $match: noSavingFilter },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$transactionDate',
                  timezone: 'Asia/Ho_Chi_Minh',
                },
              },
              type: '$type',
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]),
      BudgetGoal.findOne({ month, year }).lean() as any,
      Transaction.aggregate([
        { $match: { ...dateFilter, category: 'saving' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Previous period totals for comparison
      Transaction.aggregate([
        { $match: prevFilter },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),
      // Previous period daily spending
      Transaction.aggregate([
        { $match: prevDailyFilter },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$transactionDate', timezone: 'Asia/Ho_Chi_Minh' } },
              type: '$type',
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]),
    ]);

  const totalIncome =
    totals.find((t: any) => t._id === 'income')?.total || 0;
  const totalExpense =
    totals.find((t: any) => t._id === 'expense')?.total || 0;

  const totalExpenseForPercentage = totalExpense || 1;
  const categoryBudgetMap: Record<string, number> = {};
  (budgetGoal?.categoryBudgets || []).forEach((cb: any) => {
    categoryBudgetMap[cb.category] = cb.amount;
  });

  const categories = categoryBreakdown.map((c: any) => ({
    category: c._id,
    total: c.total,
    count: c.count,
    percentage: Math.round((c.total / totalExpenseForPercentage) * 100),
    budget: categoryBudgetMap[c._id] || null,
    remaining: categoryBudgetMap[c._id] ? categoryBudgetMap[c._id] - c.total : null,
  }));

  // Group daily spending by date
  const dailyMap: Record<string, { income: number; expense: number }> = {};
  dailySpending.forEach((d: any) => {
    if (!dailyMap[d._id.date]) {
      dailyMap[d._id.date] = { income: 0, expense: 0 };
    }
    dailyMap[d._id.date][d._id.type as 'income' | 'expense'] = d.total;
  });

  const daily = Object.entries(dailyMap)
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group previous period daily spending (by day-of-month for overlay comparison)
  const prevDailyMap: Record<string, { income: number; expense: number }> = {};
  prevDailySpending.forEach((d: any) => {
    if (!prevDailyMap[d._id.date]) {
      prevDailyMap[d._id.date] = { income: 0, expense: 0 };
    }
    prevDailyMap[d._id.date][d._id.type as 'income' | 'expense'] = d.total;
  });
  const prevDaily = Object.entries(prevDailyMap)
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Previous period comparison
  const prevExpense = prevTotals.find((t: any) => t._id === 'expense')?.total || 0;
  const spendingChange = prevExpense > 0
    ? Math.round(((totalExpense - prevExpense) / prevExpense) * 100)
    : null;

  // Daily allowance: remaining budget / remaining days
  const budget = budgetGoal?.totalBudget || 0;
  const remaining = budget - totalExpense;
  const daysInMonth = new Date(year, month, 0).getDate();
  const vn = nowVN();
  const dayOfMonth = vn.getUTCDate();
  const daysLeft = Math.max(1, daysInMonth - dayOfMonth + 1);
  const dailyAllowance = budget > 0 ? Math.round(Math.max(0, remaining) / daysLeft) : 0;

  // Average daily spending so far this month
  const avgDailySpending = dayOfMonth > 0 ? Math.round(totalExpense / dayOfMonth) : 0;

  // ─── Streak: days under daily budget ───
  let streak = 0;
  if (budget > 0) {
    const dailyBudget = Math.round(budget / daysInMonth);
    // Get last 60 days of daily expense data
    const streakStart = vnMidnightUTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() - 59);
    const streakEnd = new Date(vnMidnightUTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() + 1).getTime() - 1);
    const streakData = await Transaction.aggregate([
      { $match: { transactionDate: { $gte: streakStart, $lte: streakEnd }, categorized: true, type: 'expense', category: { $ne: 'saving' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$transactionDate', timezone: 'Asia/Ho_Chi_Minh' } }, total: { $sum: '$amount' } } },
      { $sort: { _id: -1 } },
    ]);
    const expenseByDate: Record<string, number> = {};
    streakData.forEach((d: any) => { expenseByDate[d._id] = d.total; });

    // Count consecutive days (from yesterday backwards) where spending <= dailyBudget
    for (let i = 1; i <= 60; i++) {
      const d = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() - i));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      const dayExpense = expenseByDate[key] || 0;
      if (dayExpense <= dailyBudget) streak++;
      else break;
    }
  }

  return res.json({
    month,
    year,
    range,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    budgetGoal: budget || null,
    budgetRemaining: budget ? remaining : null,
    savingGoal: budgetGoal?.savingGoal || null,
    actualSaving: savingTotal[0]?.total || 0,
    categoryBreakdown: categories,
    dailySpending: daily,
    prevDailySpending: prevDaily,
    spendingChange,
    prevExpense,
    dailyAllowance,
    avgDailySpending,
    daysLeft,
    daysInMonth,
    streak,
  });
}
