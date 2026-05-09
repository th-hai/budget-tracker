import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { sendMessage, buildCategoryKeyboard } from '@/lib/telegram';
import { L } from '@/lib/labels';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron secret (Vercel cron sends this header)
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await connectDB();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Find uncategorized transactions from today
  const uncategorized = await Transaction.find({
    categorized: false,
    transactionDate: { $gte: today, $lt: tomorrow },
  }).lean();

  if (uncategorized.length > 0) {
    const lines = uncategorized.map((tx: any) => {
      const amountK = Math.round(tx.amount / 1000);
      return `- ${tx.type === 'income' ? '+' : '-'}${amountK}k: ${tx.note || L.telegram.noNote}`;
    });

    await sendMessage(
      `${L.telegram.reminderTitle}\n\n` +
        `${L.telegram.reminderBody(uncategorized.length)}\n\n` +
        lines.join('\n') +
        L.telegram.reminderFooter
    );

    // Re-send category keyboards for each
    for (const tx of uncategorized) {
      const amountK = Math.round((tx as any).amount / 1000);
      await sendMessage(
        `<b>${(tx as any).type === 'income' ? '+' : '-'}${amountK}k</b> - ${(tx as any).note || L.telegram.noNote}\n${L.telegram.selectCategory}`,
        {
          reply_markup: {
            inline_keyboard: buildCategoryKeyboard((tx as any)._id.toString()),
          },
        }
      );
    }
  }

  // Also send daily summary
  const transactions = await Transaction.find({
    transactionDate: { $gte: today, $lt: tomorrow },
    categorized: true,
  }).lean();

  if (transactions.length > 0) {
    let totalOut = 0;
    transactions.forEach((tx: any) => {
      if (tx.type === 'expense') totalOut += tx.amount;
    });

    const totalOutK = Math.round(totalOut / 1000);
    await sendMessage(
      L.telegram.dailySummary(totalOutK.toLocaleString(), transactions.filter((t: any) => t.type === 'expense').length)
    );
  }

  return res.json({ success: true });
}
