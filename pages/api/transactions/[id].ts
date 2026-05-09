import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectDB();
  const { id } = req.query;

  if (req.method === 'GET') {
    const transaction = await Transaction.findById(id).lean();
    if (!transaction) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    }
    return res.json(transaction);
  }

  if (req.method === 'PUT') {
    const transaction = await Transaction.findByIdAndUpdate(id, req.body, {
      new: true,
    }).lean();
    if (!transaction) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    }
    return res.json(transaction);
  }

  if (req.method === 'DELETE') {
    const transaction = await Transaction.findByIdAndDelete(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    }
    return res.json({ message: 'Đã xoá giao dịch' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
