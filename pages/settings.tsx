import { useState, useEffect, useRef, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import fetcher, { postAPI } from '@/lib/api';
import { formatVND, formatVNDShort } from '@/lib/format';
import PageShell from '@/components/layout/PageShell';
import Card from '@/components/ui/Card';
import Segmented from '@/components/ui/Segmented';
import LogoMark from '@/components/LogoMark';
import { L } from '@/lib/labels';
import { ChartType, useTheme } from '@/lib/theme';

const BUDGET_PRESETS = [3000, 5000, 7000, 10000, 15000, 20000];
const SAVING_PRESETS = [500, 1000, 2000, 3000, 5000];

// Format number with dots: 10000 → 10.000
function formatNumber(val: string): string {
  const num = val.replace(/\D/g, '');
  if (!num) return '';
  return Number(num).toLocaleString('de-DE');
}

// Strip formatting to get raw number
function parseFormatted(val: string): string {
  return val.replace(/\./g, '');
}

function MonthSelector({ month, year, onChange }: { month: number; year: number; onChange: (delta: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => onChange(-1)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-nero/10 bg-white text-lg font-bold text-nero/60 transition-all hover:text-nero/80 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-cream/60"
      >
        ‹
      </button>
      <span className="min-w-[150px] rounded-full border border-nero/10 bg-white px-5 py-2 text-center text-base font-bold dark:border-white/10 dark:bg-white/5">
        Tháng {month}/{year}
      </span>
      <button
        onClick={() => onChange(1)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-nero/10 bg-white text-lg font-bold text-nero/60 transition-all hover:text-nero/80 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-cream/60"
      >
        ›
      </button>
    </div>
  );
}

function AmountInput({
  value,
  onChange,
  focused,
  onFocus,
  onBlur,
  placeholder = '0',
}: {
  value: string;
  onChange: (raw: string) => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const display = formatNumber(value);
  const amount = Number(value || 0) * 1000;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFormatted(e.target.value);
    onChange(raw);
  }, [onChange]);

  const shortLabel = amount >= 1_000_000_000
    ? `${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}tỷ`
    : amount >= 1_000_000
      ? `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}tr`
      : '';
  const dailyAmount = Number(value || 0) * 1000;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daily = dailyAmount > 0 ? Math.round(dailyAmount / daysInMonth) : 0;

  return (
    <div className="relative rounded-2xl bg-nero/[0.03] px-4 py-3 dark:bg-white/[0.04]">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={() => setTimeout(onBlur, 150)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-2xl font-bold tracking-wide outline-none placeholder:text-nero/20 dark:placeholder:text-cream/20"
        />
        <span className="shrink-0 rounded-full bg-nero/80 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-white/15 dark:text-cream/70">
          K
        </span>
      </div>
      {amount > 0 && (
        <p className="mt-1 text-[11px] font-semibold text-[color:var(--text-muted)]">
          = {shortLabel || formatVND(amount)}
          {daily > 0 && <> · ≈ {formatVNDShort(daily)}/ngày</>}
        </p>
      )}
    </div>
  );
}

function PresetPills({ presets, value, onChange }: { presets: number[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex justify-between gap-1.5">
      {presets.map((v) => (
        <button
          key={v}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onChange(String(v));
          }}
          className={`flex-1 rounded-full border py-1.5 text-xs font-bold transition-all duration-150 active:scale-[0.96] ${
            value === String(v)
              ? 'border-nero/20 bg-nero text-white dark:border-cream/20 dark:bg-cream dark:text-nero'
              : 'border-nero/10 bg-transparent text-nero/40 hover:border-nero/20 dark:border-white/10 dark:text-cream/40 dark:hover:border-white/20'
          }`}
        >
          {v >= 1000 ? `${(v / 1000).toFixed(0)}tr` : `${v}k`}
        </button>
      ))}
    </div>
  );
}

function getBudgetInsight(amount: number, daysInMonth: number): string {
  const daily = Math.round(amount / daysInMonth);
  if (amount === 0) return '';
  if (daily < 100_000) return 'Ngân sách khá hạn chế, hãy cân nhắc chi tiêu cẩn thận';
  if (daily < 300_000) return 'Ngân sách hợp lý cho chi tiêu hàng ngày';
  return 'Ngân sách thoải mái, hãy tận dụng để tiết kiệm thêm';
}

function getSavingInsight(pct: number): { icon: string; text: string } {
  if (pct >= 100) return { icon: '🎉', text: 'Bạn đã hoàn thành mục tiêu tháng này!' };
  if (pct >= 80) return { icon: '🔥', text: 'Sắp đạt rồi! Chỉ cần thêm một chút nữa' };
  if (pct >= 50) return { icon: '🎯', text: 'Bạn đang đi đúng kế hoạch' };
  if (pct >= 20) return { icon: '💡', text: 'Hãy cố gắng thêm, mỗi đồng đều có giá trị' };
  if (pct > 0) return { icon: '⚡', text: 'Bắt đầu tốt rồi, tiếp tục nhé!' };
  return { icon: '🌱', text: 'Bắt đầu tiết kiệm hôm nay để đạt mục tiêu' };
}

function getSavingAccentColor(pct: number): string {
  if (pct >= 80) return '#4ECDC4';
  if (pct >= 40) return '#7EC8A0';
  return '#F0D87A';
}

function AnimatedProgress({ value, max, accent }: { value: number; max: number; accent: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const clamped = Math.max(0, Math.min(100, pct));
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    setAnimated(0);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimated(clamped));
    });
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  return (
    <div
      className="w-full overflow-hidden rounded-full"
      style={{ height: 8, background: 'var(--track)' }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${animated}%`,
          background: `linear-gradient(90deg, ${accent}cc, ${accent})`,
          transition: 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: animated > 50 ? `0 0 10px ${accent}35` : 'none',
        }}
      />
    </div>
  );
}

function AppearanceCard() {
  const { style, setStyle, chartType, setChartType, density, setDensity } = useTheme();

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-nero/[0.04] text-sm dark:bg-white/[0.06]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-nero/50 dark:text-cream/50">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </span>
        <h2 className="text-sm font-bold">Giao diện</h2>
      </div>
      <p className="mb-2 text-xs font-bold text-[color:var(--text-muted)]">Phong cách</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'calm', title: 'Calm', sub: 'Tối giản', colors: ['#4ECDC4', '#FFFDF7', '#B8BFC6'] },
          { key: 'playful', title: 'Playful', sub: 'Vui vẻ', colors: ['#4ECDC4', '#FFE156', '#FF6B6B'] },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setStyle(item.key as 'calm' | 'playful')}
            className={`rounded-2xl border bg-white/60 p-3 text-left transition-all active:scale-[0.98] dark:bg-white/5 ${
              style === item.key ? 'border-teal ring-1 ring-teal' : 'border-nero/10 dark:border-white/10'
            }`}
          >
            <div className="mb-3 flex gap-1">
              {item.colors.map((color) => <span key={color} className="h-5 w-5 rounded-full" style={{ backgroundColor: color }} />)}
            </div>
            <p className="text-sm font-bold">{item.title}</p>
            <p className="text-xs font-semibold text-[color:var(--text-muted)]">{item.sub}</p>
          </button>
        ))}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-bold text-[color:var(--text-muted)]">Kiểu biểu đồ</p>
        <Segmented
          value={chartType}
          onChange={(value) => setChartType(value as ChartType)}
          options={[
            { key: 'donut', label: 'Donut' },
            { key: 'bar', label: 'Cột' },
            { key: 'stacked', label: 'Stack' },
            { key: 'daily', label: '14 ngày' },
          ]}
        />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-bold text-[color:var(--text-muted)]">Mật độ</p>
        <Segmented
          value={density}
          onChange={(value) => setDensity(value as 'compact' | 'roomy')}
          options={[
            { key: 'compact', label: 'Gọn' },
            { key: 'roomy', label: 'Thoáng' },
          ]}
        />
      </div>
    </Card>
  );
}

export default function SettingsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [totalBudget, setTotalBudget] = useState('');
  const [savingGoal, setSavingGoal] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);
  const [savedBudget, setSavedBudget] = useState(false);
  const [savingSaving, setSavingSaving] = useState(false);
  const [savedSaving, setSavedSaving] = useState(false);
  const [budgetFocused, setBudgetFocused] = useState(false);
  const [savingFocused, setSavingFocused] = useState(false);

  const { data: goal } = useSWR(`/api/budget-goal?month=${month}&year=${year}`, fetcher);
  const { data: summary } = useSWR(`/api/transactions/summary?month=${month}&year=${year}`, fetcher);

  useEffect(() => {
    if (goal) {
      setTotalBudget(goal.totalBudget ? String(goal.totalBudget / 1000) : '');
      setSavingGoal(goal.savingGoal ? String(goal.savingGoal / 1000) : '');
    } else {
      setTotalBudget('');
      setSavingGoal('');
    }
  }, [goal]);

  const revalidateAll = () => {
    mutate((key) => typeof key === 'string' && key.startsWith('/api/'), undefined, { revalidate: true });
  };

  const handleSaveBudget = async () => {
    if (!totalBudget || Number(totalBudget) <= 0) return;
    setSavingBudget(true);
    try {
      await postAPI('/api/budget-goal', {
        month,
        year,
        totalBudget: Number(totalBudget) * 1000,
        savingGoal: goal?.savingGoal || 0,
      });
      setSavedBudget(true);
      setTimeout(() => setSavedBudget(false), 2000);
      revalidateAll();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingBudget(false);
    }
  };

  const handleSaveSaving = async () => {
    setSavingSaving(true);
    try {
      await postAPI('/api/budget-goal', {
        month,
        year,
        totalBudget: goal?.totalBudget || 0,
        savingGoal: Number(savingGoal || 0) * 1000,
      });
      setSavedSaving(true);
      setTimeout(() => setSavedSaving(false), 2000);
      revalidateAll();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSaving(false);
    }
  };

  const handleMonthChange = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; } else if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  };

  const budgetAmount = Number(totalBudget || 0) * 1000;
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyAllowance = budgetAmount > 0 ? Math.round(budgetAmount / daysInMonth) : 0;

  const actualSaving = summary?.actualSaving || 0;
  const savingGoalAmount = Number(savingGoal || 0) * 1000;
  const savingPct = savingGoalAmount > 0 ? Math.round((actualSaving / savingGoalAmount) * 100) : 0;
  const savingAccent = getSavingAccentColor(savingPct);
  const savingRemaining = Math.max(0, savingGoalAmount - actualSaving);
  const dayOfMonth = now.getDate();
  const daysLeft = Math.max(1, daysInMonth - dayOfMonth + 1);
  const dailySavingNeeded = savingRemaining > 0 ? Math.round(savingRemaining / daysLeft) : 0;
  const savingInsight = getSavingInsight(savingPct);

  return (
    <PageShell>
      <div className="mb-6 flex items-end justify-between">
        <h1 className="text-3xl font-bold tracking-[-0.04em]">{L.settings.title}</h1>
        <LogoMark size={34} />
      </div>

      <div className="space-y-4">
        <MonthSelector month={month} year={year} onChange={handleMonthChange} />

        {/* ─── Budget Card ─── */}
        <Card>
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-nero/[0.04] text-sm dark:bg-white/[0.06]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-nero/50 dark:text-cream/50">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M12 10v4" />
                <path d="M10 12h4" />
              </svg>
            </span>
            <h2 className="text-sm font-bold">{L.settings.budgetTitle}</h2>
          </div>

          <AmountInput
            value={totalBudget}
            onChange={setTotalBudget}
            focused={budgetFocused}
            onFocus={() => setBudgetFocused(true)}
            onBlur={() => setBudgetFocused(false)}
          />

          {budgetFocused && (
            <div className="mt-2.5">
              <PresetPills presets={BUDGET_PRESETS} value={totalBudget} onChange={setTotalBudget} />
            </div>
          )}

          <button
            onClick={handleSaveBudget}
            disabled={savingBudget || !totalBudget || Number(totalBudget) <= 0}
            className={`mt-4 w-full rounded-2xl py-3 text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed ${
              savedBudget
                ? 'bg-teal/80 text-white'
                : 'bg-teal text-nero hover:brightness-95 dark:text-nero'
            }`}
          >
            {savingBudget ? L.settings.saving : savedBudget ? '✓ ' + L.settings.saved : L.settings.budgetSave}
          </button>
        </Card>

        {/* ─── Savings Card ─── */}
        <Card className="relative overflow-hidden">
          {savingPct >= 100 && (
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal/8" />
          )}

          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-nero/[0.04] text-sm dark:bg-white/[0.06]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-nero/50 dark:text-cream/50">
                  <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2" />
                  <path d="M2 9.1a5 5 0 0 1 5.4-5" />
                </svg>
              </span>
              <h2 className="text-sm font-bold">{L.settings.savingTitle}</h2>
            </div>
            {savingGoalAmount > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors ${
                savingPct >= 100
                  ? 'bg-teal/15 text-teal'
                  : savingPct >= 50
                    ? 'bg-teal/8 text-teal/70'
                    : 'bg-nero/[0.04] text-nero/35 dark:bg-white/[0.05] dark:text-cream/35'
              }`}>
                {Math.max(0, savingPct)}%
              </span>
            )}
          </div>

          <AmountInput
            value={savingGoal}
            onChange={setSavingGoal}
            focused={savingFocused}
            onFocus={() => setSavingFocused(true)}
            onBlur={() => setSavingFocused(false)}
          />

          {savingFocused && (
            <div className="mt-2.5">
              <PresetPills presets={SAVING_PRESETS} value={savingGoal} onChange={setSavingGoal} />
            </div>
          )}

          {savingGoalAmount > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-xs font-bold" style={{ color: savingAccent }}>
                  {formatVNDShort(actualSaving)}
                </span>
                <span className="text-[11px] font-semibold text-[color:var(--text-muted)]">
                  / {formatVNDShort(savingGoalAmount)}
                </span>
              </div>
              <AnimatedProgress value={actualSaving} max={savingGoalAmount} accent={savingAccent} />

              <div className="mt-2.5 rounded-xl px-3 py-2" style={{ backgroundColor: `${savingAccent}0d` }}>
                <p className="text-xs font-bold" style={{ color: savingAccent }}>
                  {savingInsight.icon} {savingInsight.text}
                </p>
                {savingPct < 100 && dailySavingNeeded > 0 && (
                  <p className="mt-0.5 text-[11px] font-medium" style={{ color: `${savingAccent}88` }}>
                    Cần ~{formatVNDShort(dailySavingNeeded)}/ngày · còn {daysLeft} ngày
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleSaveSaving}
            disabled={savingSaving}
            className={`mt-4 w-full rounded-2xl py-3 text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed ${
              savedSaving
                ? 'bg-teal/80 text-white'
                : 'bg-teal text-nero hover:brightness-95 dark:text-nero'
            }`}
          >
            {savingSaving ? L.settings.saving : savedSaving ? '✓ ' + L.settings.saved : L.settings.savingSave}
          </button>
        </Card>

        <AppearanceCard />
      </div>
    </PageShell>
  );
}
