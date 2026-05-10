import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import fetcher, { postAPI } from '@/lib/api';
import { formatVND, formatVNDShort } from '@/lib/format';
import PageShell from '@/components/layout/PageShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Progress from '@/components/ui/Progress';
import Segmented from '@/components/ui/Segmented';
import LogoMark from '@/components/LogoMark';
import { L } from '@/lib/labels';
import { ChartType, useTheme } from '@/lib/theme';

const BUDGET_PRESETS = [3000, 5000, 7000, 10000, 15000, 20000];
const SAVING_PRESETS = [500, 1000, 2000, 3000, 5000];

function BudgetInput({
  value,
  onChange,
  presets,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  presets: number[];
  label: string;
}) {
  const [focused, setFocused] = useState(false);
  const amount = Number(value || 0) * 1000;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyAllowance = amount > 0 ? Math.round(amount / daysInMonth) : 0;

  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-[color:var(--text-muted)]">{label}</label>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="0"
          className="input-brutal !py-3 !pr-14 text-center text-2xl font-bold"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-nero/80 px-2 py-1 text-[10px] font-bold text-white dark:bg-white/15">k</span>
      </div>
      {value && Number(value) > 0 && (
        <div className="mt-2 text-center">
          <p className="text-xs font-semibold text-[color:var(--text-muted)]">= {formatVND(amount)}</p>
          {dailyAllowance > 0 && (
            <p className="mt-0.5 text-[11px] font-medium opacity-35">≈ {formatVNDShort(dailyAllowance)}/ngày</p>
          )}
        </div>
      )}
      {focused && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {presets.map((v) => (
            <button
              key={v}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(String(v));
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-150 active:scale-[0.98] ${
                value === String(v)
                  ? 'bg-yolk text-nero shadow-sm'
                  : 'bg-nero/5 text-nero/50 hover:bg-nero/10 dark:bg-white/5 dark:text-cream/50'
              }`}
            >
              {v >= 1000 ? `${(v / 1000).toFixed(0)}tr` : `${v}k`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MonthSelector({ month, year, onChange }: { month: number; year: number; onChange: (delta: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onChange(-1)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-nero/10 bg-white text-base font-bold text-nero/40 transition-colors hover:text-nero/70 dark:border-white/10 dark:bg-white/5 dark:text-cream/50"
      >
        ‹
      </button>
      <span className="min-w-[130px] text-center text-lg font-bold">Tháng {month}/{year}</span>
      <button
        onClick={() => onChange(1)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-nero/10 bg-white text-base font-bold text-nero/40 transition-colors hover:text-nero/70 dark:border-white/10 dark:bg-white/5 dark:text-cream/50"
      >
        ›
      </button>
    </div>
  );
}

function AppearanceCard() {
  const { style, setStyle, dark, setDark, chartType, setChartType, density, setDensity } = useTheme();

  return (
    <Card>
      <h2 className="mb-4 text-sm font-bold">Giao diện</h2>
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'calm', title: 'Calm', sub: 'Tối giản', colors: ['#FFFDF7', '#4ECDC4', '#FFE156'] },
          { key: 'playful', title: 'Playful', sub: 'Vui vẻ', colors: ['#FFF6E5', '#FF6B6B', '#FFE156'] },
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

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-nero/[0.03] p-3 dark:bg-white/[0.04]">
        <div>
          <p className="text-sm font-bold">Chế độ tối</p>
          <p className="text-xs font-semibold text-[color:var(--text-muted)]">Dịu mắt hơn vào buổi tối</p>
        </div>
        <button
          type="button"
          onClick={() => setDark(!dark)}
          className={`h-7 w-[46px] rounded-full p-1 transition-colors ${dark ? 'bg-teal' : 'bg-nero/15'}`}
        >
          <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${dark ? 'translate-x-[18px]' : ''}`} />
        </button>
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
    if (m > 12) {
      m = 1;
      y++;
    } else if (m < 1) {
      m = 12;
      y--;
    }
    setMonth(m);
    setYear(y);
  };

  const actualSaving = summary?.actualSaving || 0;
  const savingGoalAmount = Number(savingGoal || 0) * 1000;
  const savingPct = savingGoalAmount > 0 ? Math.round((actualSaving / savingGoalAmount) * 100) : 0;

  return (
    <PageShell>
      <div className="mb-6 flex items-end justify-between">
        <h1 className="text-3xl font-bold tracking-[-0.04em]">{L.settings.title}</h1>
        <LogoMark size={34} />
      </div>

      <div className="space-y-5">
        <MonthSelector month={month} year={year} onChange={handleMonthChange} />

        <Card>
          <h2 className="mb-5 text-sm font-bold">{L.settings.budgetTitle}</h2>
          <BudgetInput value={totalBudget} onChange={setTotalBudget} presets={BUDGET_PRESETS} label={L.settings.budgetLabel} />
          <Button onClick={handleSaveBudget} variant="teal" className="mt-5 w-full rounded-full active:scale-[0.98]" disabled={savingBudget || !totalBudget || Number(totalBudget) <= 0}>
            {savingBudget ? L.settings.saving : savedBudget ? L.settings.saved : L.settings.budgetSave}
          </Button>
        </Card>

        <Card>
          <h2 className="mb-5 text-sm font-bold">{L.settings.savingTitle}</h2>
          <BudgetInput value={savingGoal} onChange={setSavingGoal} presets={SAVING_PRESETS} label={L.settings.savingLabel} />
          {savingGoalAmount > 0 && (
            <div className="mt-5">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[11px] font-semibold text-[color:var(--text-muted)]">
                  {L.settings.savingProgress} {formatVNDShort(actualSaving)} / {formatVNDShort(savingGoalAmount)}
                </span>
                <span className="text-[11px] font-bold text-[color:var(--text-muted)]">{Math.max(0, savingPct)}%</span>
              </div>
              <Progress value={actualSaving} max={savingGoalAmount} />
              <p className="mt-2.5 text-center text-xs font-semibold text-[color:var(--text-muted)]">
                {actualSaving >= savingGoalAmount
                  ? L.savingGoal.achieved(formatVNDShort(actualSaving - savingGoalAmount))
                  : savingPct >= 80
                    ? L.savingGoal.nearGoal(formatVNDShort(savingGoalAmount - actualSaving))
                    : L.savingGoal.inProgress(formatVNDShort(savingGoalAmount - actualSaving))}
              </p>
            </div>
          )}
          <Button onClick={handleSaveSaving} variant="teal" className="mt-5 w-full rounded-full active:scale-[0.98]" disabled={savingSaving}>
            {savingSaving ? L.settings.saving : savedSaving ? L.settings.saved : L.settings.savingSave}
          </Button>
        </Card>

        <AppearanceCard />
      </div>
    </PageShell>
  );
}
