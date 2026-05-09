import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryBudget {
  category: string;
  amount: number;
}

export interface IBudgetGoal extends Document {
  month: number;
  year: number;
  totalBudget: number;
  savingGoal: number;
  categoryBudgets: ICategoryBudget[];
}

const budgetGoalSchema = new Schema<IBudgetGoal>(
  {
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    totalBudget: { type: Number, required: true },
    savingGoal: { type: Number, default: 0 },
    categoryBudgets: [
      {
        category: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

budgetGoalSchema.index({ year: 1, month: 1 }, { unique: true });

export default mongoose.models.BudgetGoal ||
  mongoose.model<IBudgetGoal>('BudgetGoal', budgetGoalSchema);
