import { useEffect, useState } from 'react';
import { ALL_CATEGORIES, getCategoryByKey } from '@/lib/categories';
import { formatVND, formatDate, formatTime } from '@/lib/format';
import { L } from '@/lib/labels';
import BottomSheet from '@/components/ui/BottomSheet';
import { deleteAPI, putAPI } from '@/lib/api';

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
  onUpdated?: (transaction: Transaction) => void;
  onDeleted?: (id: string) => void;
  zIndex?: number;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2.5">
      <span className="text-xs font-medium opacity-40 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-right ml-4">{value}</span>
    </div>
  );
}

export default function TransactionDetail({
  transaction,
  onClose,
  onUpdated,
  onDeleted,
  zIndex = 70,
}: TransactionDetailProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (!transaction) return;
    setEditing(false);
    setSaving(false);
    setNote(transaction.note || '');
    setAmount(String(transaction.amount));
    setCategory(transaction.category);
  }, [transaction]);

  if (!transaction) return null;

  const cat = getCategoryByKey(transaction.category);
  const isIncome = transaction.type === 'income';
  const isSaving = transaction.category === 'saving';
  const isPositive = isIncome || isSaving;

  const typeLabel = isIncome ? L.detail.typeIncome : isSaving ? L.detail.typeSaving : L.detail.typeExpense;
  const sourceLabel = L.source[transaction.source as keyof typeof L.source] || transaction.source;
  const categoryOptions = ALL_CATEGORIES.filter((option) => {
    if (transaction.type === 'income') return option.key === 'income';
    return option.key !== 'income';
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await putAPI(`/api/transactions/${transaction._id}`, {
        note,
        amount: Number(amount),
        category,
      });
      onUpdated?.(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(L.detail.confirmDelete)) return;
    await deleteAPI(`/api/transactions/${transaction._id}`);
    onDeleted?.(transaction._id);
    onClose();
  };

  return (
    <BottomSheet open={!!transaction} onClose={onClose} zIndex={zIndex}>
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

      {editing ? (
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-bold opacity-40 mb-1.5">{L.detail.note}</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-brutal"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-bold opacity-40 mb-1.5">{L.detail.amount}</span>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-brutal"
            />
          </label>
          <div>
            <span className="block text-xs font-bold opacity-40 mb-1.5">{L.detail.category}</span>
            <div className="grid grid-cols-2 gap-2">
              {categoryOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setCategory(option.key)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold text-left transition-all duration-150 ${
                    category === option.key ? 'shadow-sm text-nero' : 'bg-nero/5 text-nero/45'
                  }`}
                  style={category === option.key ? { backgroundColor: option.color } : undefined}
                >
                  {option.icon} {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 rounded-xl bg-nero/5 py-3 text-sm font-bold text-nero/50"
            >
              {L.detail.cancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || Number(amount) <= 0}
              className="flex-1 rounded-xl bg-teal py-3 text-sm font-bold text-nero shadow-sm disabled:opacity-40"
            >
              {saving ? L.detail.saving : L.detail.save}
            </button>
          </div>
        </div>
      ) : (
        <>
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

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex-1 rounded-xl bg-teal/15 py-3 text-sm font-bold text-teal"
            >
              {L.detail.edit}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 rounded-xl bg-coral/10 py-3 text-sm font-bold text-coral"
            >
              {L.detail.delete}
            </button>
          </div>
        </>
      )}

      <p className="text-[10px] font-medium opacity-20 text-center mt-4">
        ID: {transaction._id}
      </p>
    </BottomSheet>
  );
}
