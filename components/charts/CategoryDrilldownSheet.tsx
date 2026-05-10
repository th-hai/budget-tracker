import BottomSheet from '@/components/ui/BottomSheet';
import { getCategoryByKey } from '@/lib/categories';
import { formatDateSmart, formatTime, formatVNDShort, formatSourceLabel } from '@/lib/format';
import { L } from '@/lib/labels';

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
  };
}

interface CategorySummary {
  category: string;
  total: number;
  percentage: number;
  count?: number;
}

interface CategoryDrilldownSheetProps {
  open: boolean;
  categoryKey: string | null;
  summary?: CategorySummary;
  transactions: Transaction[];
  loading: boolean;
  onClose: () => void;
  onSelectTransaction: (transaction: Transaction) => void;
}

function getLargestInsight(transactions: Transaction[], subtotal: number, categoryLabel: string) {
  if (!transactions.length || subtotal <= 0) return null;
  const largest = transactions.reduce((max, tx) => (tx.amount > max.amount ? tx : max), transactions[0]);
  const share = Math.round((largest.amount / subtotal) * 100);
  const note = largest.note || categoryLabel;
  return L.analytics.largestInsight(note, share, categoryLabel);
}

export default function CategoryDrilldownSheet({
  open,
  categoryKey,
  summary,
  transactions,
  loading,
  onClose,
  onSelectTransaction,
}: CategoryDrilldownSheetProps) {
  const cat = categoryKey ? getCategoryByKey(categoryKey) : undefined;
  const subtotal = summary?.total || 0;
  const count = summary?.count || transactions.length;
  const average = count > 0 ? Math.round(subtotal / count) : 0;
  const largest = transactions.length
    ? transactions.reduce((max, tx) => (tx.amount > max.amount ? tx : max), transactions[0])
    : null;
  const insight = cat ? getLargestInsight(transactions, subtotal, cat.label) : null;

  return (
    <BottomSheet open={open} onClose={onClose} zIndex={60}>
      <div className="pb-1">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: (cat?.color || '#B8BFC6') + '30' }}
            >
              {cat?.icon || '📌'}
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold truncate">{cat?.label || L.detail.category}</p>
              <p className="text-xs font-semibold opacity-35">
                {L.analytics.transactions(count)} · {L.analytics.categoryShare(summary?.percentage || 0)}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-coral">-{formatVNDShort(subtotal)}</p>
            <p className="text-[11px] font-semibold opacity-35">{L.analytics.totalSpending}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-2xl bg-nero/[0.03] px-3 py-3">
            <p className="text-[10px] font-semibold opacity-35 mb-1">{L.analytics.transactionCount}</p>
            <p className="text-sm font-bold">{count}</p>
          </div>
          <div className="rounded-2xl bg-nero/[0.03] px-3 py-3">
            <p className="text-[10px] font-semibold opacity-35 mb-1">{L.analytics.average}</p>
            <p className="text-sm font-bold">{formatVNDShort(average)}</p>
          </div>
          <div className="rounded-2xl bg-nero/[0.03] px-3 py-3">
            <p className="text-[10px] font-semibold opacity-35 mb-1">{L.analytics.largest}</p>
            <p className="text-sm font-bold">{largest ? formatVNDShort(largest.amount) : '0đ'}</p>
          </div>
        </div>

        {insight && (
          <div
            className="rounded-2xl px-3.5 py-3 mb-4 text-xs font-bold leading-relaxed"
            style={{ backgroundColor: (cat?.color || '#FFE156') + '22' }}
          >
            {insight}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-nero/[0.04] animate-pulse" />
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-2 transition-all duration-300">
            {transactions.map((tx) => {
              const payment = tx.bankData?.gateway || formatSourceLabel(tx.source);
              return (
                <button
                  key={tx._id}
                  type="button"
                  onClick={() => onSelectTransaction(tx)}
                  className="w-full flex items-center gap-3 rounded-2xl bg-cream/70 border border-nero/6 px-3 py-3 text-left transition-all duration-150 active:scale-[0.98] hover:bg-cream"
                >
                  <span
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: cat?.color || '#B8BFC6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{tx.note || cat?.label || 'Giao dịch'}</p>
                    <p className="text-[11px] font-semibold opacity-35 mt-0.5">
                      {formatDateSmart(tx.transactionDate)} · {formatTime(tx.transactionDate)} · {payment}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-coral shrink-0">
                    -{formatVNDShort(tx.amount)}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-9">
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-3"
              style={{ backgroundColor: (cat?.color || '#B8BFC6') + '24' }}
            >
              {cat?.icon || '📌'}
            </div>
            <p className="text-sm font-bold opacity-45">{L.analytics.emptyCategory}</p>
            <p className="text-xs font-medium opacity-25 mt-1">{L.analytics.emptyCategoryHint}</p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
