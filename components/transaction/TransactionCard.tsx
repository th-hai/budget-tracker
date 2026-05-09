import { getCategoryByKey } from '@/lib/categories';
import { formatVND, formatTime } from '@/lib/format';

interface TransactionCardProps {
  transaction: {
    _id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    note: string;
    transactionDate: string;
    source: string;
  };
  onClick?: () => void;
}

export default function TransactionCard({ transaction, onClick }: TransactionCardProps) {
  const cat = getCategoryByKey(transaction.category);
  const isIncome = transaction.type === 'income';
  const isSaving = transaction.category === 'saving';
  const isPositive = isIncome || isSaving;

  return (
    <div
      className="flex items-center gap-3 py-3 cursor-pointer rounded-xl px-2.5 -mx-2.5 transition-all duration-100 active:scale-[0.98] active:bg-nero/[0.03] hover:bg-nero/[0.02]"
      onClick={onClick}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: (cat?.color || '#FFE156') + '25' }}
      >
        {cat?.icon || '📌'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold truncate leading-tight">
          {transaction.note || cat?.label || 'Giao dich'}
        </p>
        <p className="text-[11px] font-medium opacity-35 mt-0.5">
          {cat?.label} · {formatTime(transaction.transactionDate)}
        </p>
      </div>
      <span className={`text-[13px] font-bold shrink-0 ${isPositive ? 'text-teal' : 'text-coral'}`}>
        {isPositive ? '+' : '-'}{formatVND(transaction.amount)}
      </span>
    </div>
  );
}
