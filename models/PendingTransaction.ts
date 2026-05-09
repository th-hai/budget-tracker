import mongoose, { Schema, Document } from 'mongoose';

export interface IPendingTransaction extends Document {
  sepayId: number;
  gateway?: string;
  transactionDate: Date;
  accountNumber?: string;
  referenceCode?: string;
  content?: string;
  transferType: 'in' | 'out';
  transferAmount: number;
  accumulated?: number;
  description?: string;
  telegramMessageId?: number;
  categorized: boolean;
  reminderSent: boolean;
}

const pendingTransactionSchema = new Schema<IPendingTransaction>(
  {
    sepayId: { type: Number, required: true },
    gateway: String,
    transactionDate: { type: Date, required: true },
    accountNumber: String,
    referenceCode: String,
    content: String,
    transferType: { type: String, enum: ['in', 'out'], required: true },
    transferAmount: { type: Number, required: true },
    accumulated: Number,
    description: String,
    telegramMessageId: Number,
    categorized: { type: Boolean, default: false },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

pendingTransactionSchema.index(
  {
    sepayId: 1,
    referenceCode: 1,
    transferType: 1,
    transferAmount: 1,
  },
  { unique: true }
);
pendingTransactionSchema.index({ categorized: 1 });

export default mongoose.models.PendingTransaction ||
  mongoose.model<IPendingTransaction>(
    'PendingTransaction',
    pendingTransactionSchema
  );
