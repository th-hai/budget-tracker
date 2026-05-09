import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import BudgetGoal from '@/models/BudgetGoal';

function getDateRange(range: string, month: number, year: number) {
  const now = new Date();

  if (range === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    end.setMilliseconds(-1);
    return { start, end };
  }

  if (range === 'week') {
    const day = now.getDay(); // 0=Sun
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  }

  // Default: month
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
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

  const { start, end } = getDateRange(range, month, year);

  const dateFilter = {
    transactionDate: { $gte: start, $lte: end },
    categorized: true,
  };

  // Exclude saving from totals/daily (not real spending), but include in category breakdown (pie chart)
  const noSavingFilter = { ...dateFilter, category: { $ne: 'saving' } };

  const [totals, categoryBreakdown, dailySpending, budgetGoal, savingTotal] =
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

  return res.json({
    month,
    year,
    range,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    budgetGoal: budgetGoal?.totalBudget || null,
    budgetRemaining: budgetGoal
      ? budgetGoal.totalBudget - totalExpense
      : null,
    savingGoal: budgetGoal?.savingGoal || null,
    actualSaving: savingTotal[0]?.total || 0,
    categoryBreakdown: categories,
    dailySpending: daily,
  });
}
