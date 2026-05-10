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

function getDateRange(range: string, month: number, year: number) {
  const vn = nowVN();
  const vY = vn.getUTCFullYear(), vM = vn.getUTCMonth(), vD = vn.getUTCDate();

  if (range === 'today') {
    const start = vnMidnightUTC(vY, vM, vD);
    const end = new Date(vnMidnightUTC(vY, vM, vD + 1).getTime() - 1);
    return { start, end };
  }

  if (range === 'week') {
    const day = vn.getUTCDay(); // 0=Sun
    const mondayD = vD - ((day + 6) % 7);
    const start = vnMidnightUTC(vY, vM, mondayD);
    const end = new Date(vnMidnightUTC(vY, vM, mondayD + 7).getTime() - 1);
    return { start, end };
  }

  // Default: month
  const start = vnMidnightUTC(year, month - 1, 1);
  const end = new Date(vnMidnightUTC(year, month, 1).getTime() - 1);
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
