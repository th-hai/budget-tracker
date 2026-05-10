import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectDB();

  if (req.method === 'GET') {
    const {
      page = '1',
      limit = '20',
      month,
      year,
      category,
      type,
      startDate,
      endDate,
      wallet,
      search,
    } = req.query;

    const filter: any = {};
    const noteConditions: any[] = [];

    // Vietnam timezone: UTC+7
    const VN_MS = 7 * 60 * 60 * 1000;
    function vnMid(y: number, m: number, d: number) { return new Date(Date.UTC(y, m, d) - VN_MS); }

    // Date range: prefer startDate/endDate, fall back to month/year
    if (startDate && endDate) {
      const [sy, sm, sd] = (startDate as string).split('-').map(Number);
      const [ey, em, ed] = (endDate as string).split('-').map(Number);
      filter.transactionDate = {
        $gte: vnMid(sy, sm - 1, sd),
        $lte: new Date(vnMid(ey, em - 1, ed + 1).getTime() - 1),
      };
    } else if (month && year) {
      const m = Number(month), y = Number(year);
      filter.transactionDate = {
        $gte: vnMid(y, m - 1, 1),
        $lte: new Date(vnMid(y, m, 1).getTime() - 1),
      };
    }

    if (category) filter.category = category;
    if (type) filter.type = type;
    filter.categorized = true;

    if (search && String(search).trim()) {
      const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      noteConditions.push({ note: { $regex: escaped, $options: 'i' } });
    }

    // Wallet filter: match note patterns for digital wallets
    if (wallet) {
      const walletPatterns: Record<string, RegExp> = {
        momo: /momo/i,
        zalopay: /zalopay|zalo/i,
        applepay: /apple/i,
        vnpay: /vnpay/i,
      };
      const pattern = walletPatterns[wallet as string];
      if (pattern) {
        noteConditions.push({ note: { $regex: pattern } });
      }
    }

    if (noteConditions.length === 1) {
      Object.assign(filter, noteConditions[0]);
    } else if (noteConditions.length > 1) {
      filter.$and = noteConditions;
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const [data, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ transactionDate: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    return res.json({
      data,
      pagination: {
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        total,
      },
    });
  }

  if (req.method === 'POST') {
    const { type, amount, category, note, transactionDate } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const transaction = await Transaction.create({
      type,
      amount: Number(amount),
      category,
      note: note || '',
      source: 'manual_ui',
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      categorized: true,
    });

    return res.status(201).json(transaction);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
