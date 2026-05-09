import { useState } from 'react';
import useSWR from 'swr';
import fetcher from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import TransactionList from '@/components/transaction/TransactionList';
import TransactionDetail from '@/components/transaction/TransactionDetail';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { EXPENSE_CATEGORIES } from '@/lib/categories';
import { L } from '@/lib/labels';

const TYPE_FILTERS = [
  { key: '', label: L.transactions.filterAll },
  { key: 'expense', label: L.transactions.filterExpense },
  { key: 'income', label: L.transactions.filterIncome },
];

function pad(n: number) { return n < 10 ? `0${n}` : String(n); }

export default function TransactionsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [wallet, setWallet] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const hasDateRange = !!startDate && !!endDate;

  const params = new URLSearchParams({
    page: String(page), limit: '20',
  });
  if (hasDateRange) {
    params.set('startDate', startDate);
    params.set('endDate', endDate);
  } else {
    params.set('month', String(month));
    params.set('year', String(year));
  }
  if (category) params.set('category', category);
  if (type) params.set('type', type);
  if (wallet) params.set('wallet', wallet);

  const { data, isLoading } = useSWR(`/api/transactions?${params}`, fetcher, { refreshInterval: 30000 });

  const handleMonthChange = (delta: number) => {
    if (hasDateRange) return;
    let m = month + delta, y = year;
    if (m > 12) { m = 1; y++; } else if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y); setPage(1);
  };

  const handleDateApply = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };

  const dateRangeLabel = hasDateRange
    ? `${startDate.slice(8)}/${startDate.slice(5, 7)} → ${endDate.slice(8)}/${endDate.slice(5, 7)}`
    : null;

  return (
    <PageShell>
      {/* Month selector / date range display */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {!hasDateRange && (
          <button
            onClick={() => handleMonthChange(-1)}
            className="w-9 h-9 rounded-xl bg-white border border-nero/10 flex items-center justify-center text-base font-bold text-nero/40 hover:text-nero/70 transition-colors"
            style={{ boxShadow: '0 1px 3px rgba(26,26,26,0.06)' }}
          >
            ‹
          </button>
        )}
        <h1 className="text-lg font-bold min-w-[130px] text-center">
          {hasDateRange ? dateRangeLabel : `Tháng ${month}/${year}`}
        </h1>
        {!hasDateRange && (
          <button
            onClick={() => handleMonthChange(1)}
            className="w-9 h-9 rounded-xl bg-white border border-nero/10 flex items-center justify-center text-base font-bold text-nero/40 hover:text-nero/70 transition-colors"
            style={{ boxShadow: '0 1px 3px rgba(26,26,26,0.06)' }}
          >
            ›
          </button>
        )}
      </div>

      {/* Date range button */}
      <div className="flex justify-center mb-3">
        <button
          onClick={() => setDatePickerOpen(true)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${
            hasDateRange
              ? 'bg-teal/15 text-teal'
              : 'bg-nero/5 text-nero/40 hover:bg-nero/10'
          }`}
        >
          <span>📅</span>
          {hasDateRange ? L.transactions.dateRangeActive : L.transactions.dateRange}
          {hasDateRange && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="ml-1 w-4 h-4 rounded-full bg-teal/30 text-teal flex items-center justify-center text-[10px] font-bold"
            >
              ×
            </button>
          )}
        </button>
      </div>

      {/* Type filter — segmented control */}
      <div className="flex gap-1.5 bg-nero/5 p-1 rounded-xl mb-3">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { setType(f.key); setPage(1); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              type === f.key
                ? 'bg-white text-nero shadow-sm'
                : 'text-nero/40 hover:text-nero/60'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        <button
          onClick={() => { setCategory(''); setPage(1); }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
            category === ''
              ? 'bg-yolk text-nero shadow-sm'
              : 'bg-nero/5 text-nero/40 hover:bg-nero/10'
          }`}
        >
          {L.transactions.filterAll}
        </button>
        {EXPENSE_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => { setCategory(cat.key); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
              category === cat.key
                ? 'text-nero shadow-sm'
                : 'bg-nero/5 text-nero/40 hover:bg-nero/10'
            }`}
            style={category === cat.key ? { backgroundColor: cat.color } : undefined}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Wallet filter */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {L.wallets.map((w) => (
          <button
            key={w.key}
            onClick={() => { setWallet(w.key); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1 ${
              wallet === w.key
                ? 'bg-lilac/20 text-nero shadow-sm'
                : 'bg-nero/5 text-nero/40 hover:bg-nero/10'
            }`}
          >
            <span>{w.icon}</span> {w.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-brutal h-16 animate-pulse overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yolk/10 to-transparent animate-shimmer" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Result count */}
          {data?.pagination && (
            <p className="text-[11px] font-semibold opacity-30 mb-3 px-1">
              {data.pagination.total} giao dịch
            </p>
          )}

          <TransactionList
            transactions={data?.data || []}
            onSelect={(tx) => setSelectedTx(tx)}
          />
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-nero/10 text-nero/50 hover:text-nero/70 disabled:opacity-30 transition-all"
                style={{ boxShadow: '0 1px 3px rgba(26,26,26,0.06)' }}
              >
                {L.transactions.prevPage}
              </button>
              <span className="text-sm font-bold opacity-40">{page}/{data.pagination.totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-nero/10 text-nero/50 hover:text-nero/70 disabled:opacity-30 transition-all"
                style={{ boxShadow: '0 1px 3px rgba(26,26,26,0.06)' }}
              >
                {L.transactions.nextPage}
              </button>
            </div>
          )}
        </>
      )}

      <TransactionDetail
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />

      <DateRangePicker
        open={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        onApply={handleDateApply}
        initialStart={startDate}
        initialEnd={endDate}
      />
    </PageShell>
  );
}
