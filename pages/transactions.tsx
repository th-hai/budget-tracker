import { useEffect, useState } from 'react';
import useSWR from 'swr';
import fetcher from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import TransactionList from '@/components/transaction/TransactionList';
import TransactionDetail from '@/components/transaction/TransactionDetail';
import DateRangePicker from '@/components/ui/DateRangePicker';
import Segmented from '@/components/ui/Segmented';
import Chip from '@/components/ui/Chip';
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
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const hasDateRange = !!startDate && !!endDate;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

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
  if (debouncedSearch) params.set('search', debouncedSearch);

  const { data, isLoading, mutate } = useSWR(`/api/transactions?${params}`, fetcher, { refreshInterval: 30000 });

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
      <div className="mb-4 flex items-center justify-center gap-4">
        {!hasDateRange && (
          <button
            onClick={() => handleMonthChange(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-nero/10 bg-white text-base font-bold text-nero/40 transition-colors hover:text-nero/70 dark:border-white/10 dark:bg-white/5 dark:text-cream/50"
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
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-nero/10 bg-white text-base font-bold text-nero/40 transition-colors hover:text-nero/70 dark:border-white/10 dark:bg-white/5 dark:text-cream/50"
          >
            ›
          </button>
        )}
      </div>

      {/* Date range button */}
      <div className="mb-3 flex justify-center">
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

      <Segmented
        options={TYPE_FILTERS}
        value={type}
        onChange={(value) => {
          setType(value);
          setPage(1);
        }}
        className="mb-3"
      />

      {/* Search */}
      <div className="relative mb-3">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm opacity-35 pointer-events-none">
          🔎
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={L.transactions.searchPlaceholder}
          className="w-full rounded-2xl border border-nero/10 bg-white py-3 pl-10 pr-11 text-sm font-semibold outline-none transition-all duration-150 placeholder:text-nero/25 focus:border-teal focus:shadow-[0_0_0_3px_rgba(78,205,196,0.14)] dark:border-white/10 dark:bg-white/5 dark:text-cream dark:placeholder:text-cream/25"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setDebouncedSearch('');
              setPage(1);
            }}
            aria-label={L.transactions.searchClear}
            className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-nero/5 text-sm font-bold text-nero/35 transition-all duration-150 hover:bg-nero/10 active:scale-[0.96]"
          >
            ×
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="scrollbar-none mb-3 flex snap-x gap-1.5 overflow-x-auto pb-1">
        <Chip
          onClick={() => { setCategory(''); setPage(1); }}
          active={category === ''}
        >
          {L.transactions.filterAll}
        </Chip>
        {EXPENSE_CATEGORIES.map((cat) => (
          <Chip
            key={cat.key}
            onClick={() => { setCategory(cat.key); setPage(1); }}
            active={category === cat.key}
          >
            {cat.icon} {cat.label}
          </Chip>
        ))}
      </div>

      {/* Wallet filter */}
      <div className="scrollbar-none mb-5 flex snap-x gap-1.5 overflow-x-auto pb-1">
        {L.wallets.map((w) => (
          <Chip
            key={w.key}
            onClick={() => { setWallet(w.key); setPage(1); }}
            active={wallet === w.key}
          >
            <span>{w.icon}</span> {w.label}
          </Chip>
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
                className="rounded-xl border border-nero/10 bg-white px-4 py-2 text-sm font-bold text-nero/50 transition-all hover:text-nero/70 disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-cream/50"
              >
                {L.transactions.prevPage}
              </button>
              <span className="text-sm font-bold opacity-40">{page}/{data.pagination.totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="rounded-xl border border-nero/10 bg-white px-4 py-2 text-sm font-bold text-nero/50 transition-all hover:text-nero/70 disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-cream/50"
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
        onUpdated={(tx) => {
          setSelectedTx(tx);
          mutate();
        }}
        onDeleted={() => {
          setSelectedTx(null);
          mutate();
        }}
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
