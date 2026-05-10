const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface SendMessageOptions {
  reply_markup?: any;
  parse_mode?: string;
}

export async function sendMessage(text: string, options?: SendMessageOptions) {
  const res = await fetch(`${BASE_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML',
      ...options,
    }),
  });
  return res.json();
}

export async function editMessage(
  messageId: number,
  text: string,
  options?: { reply_markup?: any }
) {
  const res = await fetch(`${BASE_URL}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      ...options,
    }),
  });
  return res.json();
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
) {
  const res = await fetch(`${BASE_URL}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });
  return res.json();
}

import { EXPENSE_CATEGORIES, SAVING_CATEGORY } from './categories';

export function buildCategoryKeyboard(transactionId: string) {
  const rows: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < EXPENSE_CATEGORIES.length; i += 3) {
    const row = EXPENSE_CATEGORIES.slice(i, i + 3).map((cat) => ({
      text: `${cat.icon} ${cat.label}`,
      callback_data: `cat:${transactionId}:${cat.key}`,
    }));
    rows.push(row);
  }
  // Add saving + edit note buttons at the bottom
  rows.push([
    { text: `${SAVING_CATEGORY.icon} ${SAVING_CATEGORY.label}`, callback_data: `cat:${transactionId}:saving` },
    { text: '✏️ Sửa ghi chú', callback_data: `note:${transactionId}` },
  ]);
  return rows;
}
