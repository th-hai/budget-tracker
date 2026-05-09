import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import BudgetGoal from '@/models/BudgetGoal';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectDB();

  if (req.method === 'GET') {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    const goal = await BudgetGoal.findOne({ month, year }).lean();
    return res.json(goal || { month, year, totalBudget: 0, savingGoal: 0, categoryBudgets: [] });
  }

  if (req.method === 'POST') {
    const { month, year, totalBudget, savingGoal, categoryBudgets } = req.body;

    if (!month || !year || totalBudget === undefined) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const goal = await BudgetGoal.findOneAndUpdate(
      { month: Number(month), year: Number(year) },
      {
        totalBudget: Number(totalBudget),
        savingGoal: Number(savingGoal) || 0,
        categoryBudgets: categoryBudgets || [],
      },
      { upsert: true, new: true }
    ).lean();

    return res.json(goal);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
