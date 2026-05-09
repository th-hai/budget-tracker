import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  source: 'manual_ui' | 'manual_telegram' | 'bank_webhook';
  bankData?: {
    sepayId?: number;
    gateway?: string;
    accountNumber?: string;
    referenceCode?: string;
    transferType?: string;
    content?: string;
    description?: string;
  };
  transactionDate: Date;
  categorized: boolean;
}

const transactionSchema = new Schema<ITransaction>(
  {
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    note: { type: String, default: '' },
    source: {
      type: String,
      enum: ['manual_ui', 'manual_telegram', 'bank_webhook'],
      required: true,
    },
    bankData: {
      sepayId: Number,
      gateway: String,
      accountNumber: String,
      referenceCode: String,
      transferType: String,
      content: String,
      description: String,
    },
    transactionDate: { type: Date, required: true },
    categorized: { type: Boolean, default: true },
  },
  { timestamps: true }
);

transactionSchema.index({ transactionDate: -1 });
transactionSchema.index({ type: 1, transactionDate: -1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ categorized: 1 });
transactionSchema.index(
  { 'bankData.sepayId': 1, 'bankData.referenceCode': 1 },
  { sparse: true }
);

export default mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', transactionSchema);
