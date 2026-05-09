import { getCategoryByKey } from '@/lib/categories';
import { formatVND, formatDate, formatTime } from '@/lib/format';
import { L } from '@/lib/labels';
import BottomSheet from '@/components/ui/BottomSheet';

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  transactionDate: string;
  source: string;
  bankData?: {
    gateway?: string;
    accountNumber?: string;
    referenceCode?: string;
  };
}

interface TransactionDetailProps {
  transaction: Transaction | null;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2.5">
      <span className="text-xs font-medium opacity-40 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-right ml-4">{value}</span>
    </div>
  );
}

export default function TransactionDetail({ transaction, onClose }: TransactionDetailProps) {
  if (!transaction) return null;

  const cat = getCategoryByKey(transaction.category);
  const isIncome = transaction.type === 'income';
  const isSaving = transaction.category === 'saving';
  const isPositive = isIncome || isSaving;

  const typeLabel = isIncome ? L.detail.typeIncome : isSaving ? L.detail.typeSaving : L.detail.typeExpense;
  const sourceLabel = L.source[transaction.source as keyof typeof L.source] || transaction.source;

  return (
    <BottomSheet open={!!transaction} onClose={onClose}>
      <div className="flex flex-col items-center mb-6 pt-2">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3"
          style={{ backgroundColor: (cat?.color || '#FFE156') + '30' }}
        >
          {cat?.icon || '📌'}
        </div>
        <p className="text-base font-bold text-center mb-1">
          {transaction.note || cat?.label || 'Giao dich'}
        </p>
        <p className={`text-2xl font-bold ${isPositive ? 'text-teal' : 'text-coral'}`}>
          {isPositive ? '+' : '-'}{formatVND(transaction.amount)}
        </p>
      </div>

      <div className="bg-nero/[0.02] rounded-2xl px-4 divide-y divide-nero/6">
        <DetailRow label={L.detail.category} value={`${cat?.icon || ''} ${cat?.label || transaction.category}`} />
        <DetailRow label={L.detail.type} value={typeLabel} />
        <DetailRow label={L.detail.date} value={formatDate(transaction.transactionDate)} />
        <DetailRow label={L.detail.time} value={formatTime(transaction.transactionDate)} />
        <DetailRow label={L.detail.source} value={sourceLabel} />
        {transaction.bankData?.gateway && (
          <DetailRow label={L.detail.bank} value={transaction.bankData.gateway} />
        )}
        {transaction.bankData?.referenceCode && (
          <DetailRow label={L.detail.refCode} value={transaction.bankData.referenceCode} />
        )}
      </div>

      <p className="text-[10px] font-medium opacity-20 text-center mt-4">
        ID: {transaction._id}
      </p>
    </BottomSheet>
  );
}
