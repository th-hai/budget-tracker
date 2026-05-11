import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import {
  sendMessage,
  editMessage,
  answerCallbackQuery,
  buildCategoryKeyboard,
} from '@/lib/telegram';
import { getCategoryByKey } from '@/lib/categories';
import { matchNoteCategory } from '@/lib/note-category-map';
import { L } from '@/lib/labels';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const update = req.body;

  try {
    if (update.message?.text) {
      await handleTextMessage(update.message);
    }

    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }
  } catch (err) {
    console.error('Telegram webhook error:', err);
  }

  return res.status(200).json({ ok: true });
}

function buildUndoKeyboard(txId: string) {
  return [[{ text: '↩️ Hoàn tác', callback_data: `undo:${txId}` }]];
}

async function handleTextMessage(message: any) {
  const text = message.text.trim();
  const chatId = String(message.chat.id);

  if (chatId !== process.env.TELEGRAM_CHAT_ID) return;

  const directNoteMatch = text.match(/^#note_([a-f0-9]{24})\s+([\s\S]+)$/i);
  if (directNoteMatch) {
    await updateTransactionNote(directNoteMatch[1], directNoteMatch[2].trim());
    return;
  }

  // Handle reply to "edit note" message
  const replyTo = message.reply_to_message;
  if (replyTo?.text) {
    const noteMatch = replyTo.text.match(/#note_([a-f0-9]{24})/i);
    if (noteMatch) {
      await updateTransactionNote(noteMatch[1], text);
      return;
    }
  }

  if (text === '/start') {
    await sendMessage(`${L.telegram.startTitle}\n\n${L.telegram.startBody}`);
    return;
  }

  if (text === '/today') {
    await handleTodaySummary();
    return;
  }

  if (text === '/month') {
    await handleMonthSummary();
    return;
  }

  // Parse manual input: "<note> <amount>k" or "<note> +<amount>k"
  const match = text.match(/^(.+?)\s+(\+?)(\d+)k$/i);
  if (!match) {
    await sendMessage(L.telegram.unknownFormat);
    return;
  }

  const [, note, plusSign, amountStr] = match;
  const amount = parseInt(amountStr) * 1000;
  const isIncome = plusSign === '+';
  const isSaving = /^saving$/i.test(note.trim());

  await connectDB();

  // Saving
  if (isSaving) {
    const tx = await Transaction.create({
      type: 'expense',
      amount,
      category: 'saving',
      note: 'Tiết kiệm',
      source: 'manual_telegram',
      transactionDate: new Date(),
      categorized: true,
    });
    await sendMessage(L.telegram.savingConfirm(amountStr), {
      reply_markup: { inline_keyboard: buildUndoKeyboard(tx._id.toString()) },
    });
    return;
  }

  // Income
  if (isIncome) {
    const tx = await Transaction.create({
      type: 'income',
      amount,
      category: 'income',
      note: note.trim(),
      source: 'manual_telegram',
      transactionDate: new Date(),
      categorized: true,
    });
    await sendMessage(L.telegram.incomeConfirm(amountStr, note.trim()), {
      reply_markup: { inline_keyboard: buildUndoKeyboard(tx._id.toString()) },
    });
    return;
  }

  // Expense — check auto-category first
  const autoCategory = matchNoteCategory(note);

  if (autoCategory) {
    const cat = getCategoryByKey(autoCategory);
    const tx = await Transaction.create({
      type: 'expense',
      amount,
      category: autoCategory,
      note: note.trim(),
      source: 'manual_telegram',
      transactionDate: new Date(),
      categorized: true,
    });
    const catLabel = cat ? `${cat.icon} ${cat.label}` : autoCategory;
    await sendMessage(
      L.telegram.autoCategorized(amountStr, catLabel, note.trim()),
      {
        reply_markup: {
          inline_keyboard: [
            ...buildCategoryKeyboard(tx._id.toString()),
            ...buildUndoKeyboard(tx._id.toString()),
          ],
        },
      }
    );
    return;
  }

  // No match — ask for category
  const tx = await Transaction.create({
    type: 'expense',
    amount,
    category: 'other',
    note: note.trim(),
    source: 'manual_telegram',
    transactionDate: new Date(),
    categorized: false,
  });
  await sendMessage(
    L.telegram.expenseAsk(amountStr, note.trim()),
    {
      reply_markup: {
        inline_keyboard: buildCategoryKeyboard(tx._id.toString()),
      },
    }
  );
}

async function updateTransactionNote(txId: string, note: string) {
  if (!note) return;

  await connectDB();
  const tx = await Transaction.findByIdAndUpdate(
    txId,
    { note },
    { new: true }
  );

  if (!tx) {
    await sendMessage(L.telegram.txNotFound);
    return;
  }

  const amountK = Math.round(tx.amount / 1000);
  const cat = getCategoryByKey(tx.category);

  if (tx.categorized) {
    const catLabel = cat ? `${cat.icon} ${cat.label}` : tx.category;
    await sendMessage(L.telegram.noteUpdated(String(amountK), catLabel, note));
    return;
  }

  await sendMessage(
    L.telegram.noteUpdatedAsk(String(amountK), note),
    {
      reply_markup: {
        inline_keyboard: buildCategoryKeyboard(txId),
      },
    }
  );
}

async function handleCallbackQuery(query: any) {
  const data = query.data;
  const parts = data.split(':');
  const prefix = parts[0];

  await connectDB();

  // Undo
  if (prefix === 'undo') {
    const txId = parts[1];
    const tx = await Transaction.findByIdAndDelete(txId);
    if (tx) {
      await answerCallbackQuery(query.id, 'Đã hoàn tác');
      await editMessage(query.message.message_id, L.telegram.undone);
    } else {
      await answerCallbackQuery(query.id, L.telegram.undoExpired);
    }
    return;
  }

  // Edit note
  if (prefix === 'note') {
    const txId = parts[1];
    const tx = await Transaction.findById(txId);
    if (!tx) {
      await answerCallbackQuery(query.id, L.telegram.txNotFound);
      return;
    }
    await answerCallbackQuery(query.id);
    await sendMessage(
      L.telegram.editNotePrompt(String(Math.round(tx.amount / 1000)), txId),
      {
        reply_markup: {
          force_reply: true,
          input_field_placeholder: tx.note || 'Ghi chú mới...',
        },
      }
    );
    return;
  }

  if (prefix !== 'cat') return;

  // Category selection
  const txId = parts[1];
  const categoryKey = parts[2];

  const tx = await Transaction.findByIdAndUpdate(
    txId,
    { category: categoryKey, categorized: true },
    { new: true }
  );

  if (!tx) {
    await answerCallbackQuery(query.id, L.telegram.txNotFound);
    return;
  }

  const cat = getCategoryByKey(categoryKey);
  const catLabel = cat ? `${cat.icon} ${cat.label}` : categoryKey;
  const amountK = Math.round(tx.amount / 1000);

  await answerCallbackQuery(query.id, `Đã phân loại: ${cat?.label || categoryKey}`);
  await editMessage(
    query.message.message_id,
    L.telegram.categorized(String(amountK), catLabel, tx.note),
    {
      reply_markup: {
        inline_keyboard: buildUndoKeyboard(tx._id.toString()),
      },
    }
  );
}

async function handleTodaySummary() {
  await connectDB();

  const VN_MS = 7 * 60 * 60 * 1000;
  const vn = new Date(Date.now() + VN_MS);
  const today = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()) - VN_MS);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const transactions = await Transaction.find({
    transactionDate: { $gte: today, $lt: tomorrow },
    categorized: true,
  })
    .sort({ transactionDate: -1 })
    .lean();

  if (transactions.length === 0) {
    await sendMessage(L.telegram.todayEmpty);
    return;
  }

  let totalIn = 0;
  let totalOut = 0;
  const lines: string[] = [];

  transactions.forEach((tx: any) => {
    const amountK = Math.round(tx.amount / 1000);
    const cat = getCategoryByKey(tx.category);
    if (tx.type === 'income') {
      totalIn += tx.amount;
      lines.push(`  +${amountK}k - ${tx.note}`);
    } else {
      totalOut += tx.amount;
      lines.push(`  -${amountK}k ${cat?.icon || ''} ${tx.note}`);
    }
  });

  await sendMessage(
    `${L.telegram.todayTitle}\n\n` +
      `${L.telegram.todayIncome(Math.round(totalIn / 1000))}\n` +
      `${L.telegram.todayExpense(Math.round(totalOut / 1000))}\n\n` +
      lines.join('\n')
  );
}

async function handleMonthSummary() {
  await connectDB();

  const VN_MS = 7 * 60 * 60 * 1000;
  const vn = new Date(Date.now() + VN_MS);
  const start = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), 1) - VN_MS);
  const end = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth() + 1, 1) - VN_MS - 1);

  const totals = await Transaction.aggregate([
    {
      $match: {
        transactionDate: { $gte: start, $lte: end },
        categorized: true,
      },
    },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);

  const totalIn = totals.find((t: any) => t._id === 'income')?.total || 0;
  const totalOut = totals.find((t: any) => t._id === 'expense')?.total || 0;
  const totalInK = Math.round(totalIn / 1000);
  const totalOutK = Math.round(totalOut / 1000);
  const balanceK = totalInK - totalOutK;

  await sendMessage(
    `${L.telegram.monthTitle(vn.getUTCMonth() + 1, vn.getUTCFullYear())}\n\n` +
      `${L.telegram.monthIncome(totalInK.toLocaleString())}\n` +
      `${L.telegram.monthExpense(totalOutK.toLocaleString())}\n` +
      L.telegram.monthBalance(balanceK.toLocaleString(), balanceK >= 0)
  );
}
