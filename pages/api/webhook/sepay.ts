import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import PendingTransaction from '@/models/PendingTransaction';
import { sendMessage, buildCategoryKeyboard } from '@/lib/telegram';
import { parseBankNote } from '@/lib/parse-bank-note';
import { L } from '@/lib/labels';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Apikey ${process.env.SEPAY_API_KEY}`) {
    return res.status(401).json({ success: false });
  }

  await connectDB();

  const payload = req.body;
  const {
    id: sepayId,
    gateway,
    transactionDate,
    accountNumber,
    referenceCode,
    content,
    transferType,
    transferAmount,
    accumulated,
    description,
  } = payload;

  // Deduplication check
  const existing = await PendingTransaction.findOne({
    sepayId,
    referenceCode,
    transferType,
    transferAmount,
  });

  if (existing) {
    return res.status(200).json({ success: true });
  }

  // Save pending transaction
  const pending = await PendingTransaction.create({
    sepayId,
    gateway,
    transactionDate: new Date(transactionDate),
    accountNumber,
    referenceCode,
    content,
    transferType,
    transferAmount,
    accumulated,
    description,
  });

  const isIncome = transferType === 'in';
  const amountK = Math.round(transferAmount / 1000);
  const noteText = parseBankNote(content || description || '');

  if (isIncome) {
    await Transaction.create({
      type: 'income',
      amount: transferAmount,
      category: 'income',
      note: noteText,
      source: 'bank_webhook',
      bankData: {
        sepayId,
        gateway,
        accountNumber,
        referenceCode,
        transferType,
        content,
        description,
      },
      transactionDate: new Date(transactionDate),
      categorized: true,
    });

    await sendMessage(
      L.telegram.bankIncome(
        amountK.toLocaleString(),
        gateway,
        noteText,
        Math.round((accumulated || 0) / 1000).toLocaleString()
      )
    );

    pending.categorized = true;
    await pending.save();
  } else {
    const tx = await Transaction.create({
      type: 'expense',
      amount: transferAmount,
      category: 'other',
      note: noteText,
      source: 'bank_webhook',
      bankData: {
        sepayId,
        gateway,
        accountNumber,
        referenceCode,
        transferType,
        content,
        description,
      },
      transactionDate: new Date(transactionDate),
      categorized: false,
    });

    const msg = await sendMessage(
      L.telegram.bankExpense(amountK.toLocaleString(), gateway, noteText),
      {
        reply_markup: {
          inline_keyboard: buildCategoryKeyboard(tx._id.toString()),
        },
      }
    );

    pending.telegramMessageId = msg.result?.message_id;
    await pending.save();
  }

  return res.status(200).json({ success: true });
}
