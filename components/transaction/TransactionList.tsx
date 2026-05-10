import { useMemo } from 'react';
import TransactionCard from './TransactionCard';
import { formatDateSmart, formatVNDShort } from '@/lib/format';
import Card from '@/components/ui/Card';
import { L } from '@/lib/labels';

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  transactionDate: string;
  source: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onSelect?: (tx: Transaction) => void;
}

export default function TransactionList({ transactions, onSelect }: TransactionListProps) {
  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach((tx) => {
      const dateKey = new Date(tx.transactionDate).toISOString().split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-14">
        <p className="text-3xl opacity-15 mb-3">📋</p>
        <p className="text-sm font-semibold opacity-30">{L.transactions.emptyList}</p>
        <p className="text-xs font-medium opacity-20 mt-1">{L.transactions.emptyListHint}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {grouped.map(([date, txs]) => {
        const dayTotal = txs.reduce((sum, tx) => {
          if (tx.category === 'saving') return sum;
          return sum + (tx.type === 'expense' ? -tx.amount : tx.amount);
        }, 0);

        return (
          <div key={date}>
            <div className="flex justify-between items-baseline mb-1.5 px-1">
              <h3 className="text-[11px] font-bold text-[color:var(--text-muted)]">
                {formatDateSmart(date)}
              </h3>
              <span className={`text-[11px] font-bold ${dayTotal >= 0 ? 'text-teal' : 'text-coral'}`}>
                {dayTotal >= 0 ? '+' : '-'}{formatVNDShort(Math.abs(dayTotal))}
              </span>
            </div>
            <Card density="compact" className="p-1.5">
              {txs.map((tx, i) => (
                <div key={tx._id}>
                  {i > 0 && <div className="border-t border-nero/5 mx-2 dark:border-white/8" />}
                  <TransactionCard transaction={tx} onClick={() => onSelect?.(tx)} />
                </div>
              ))}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
