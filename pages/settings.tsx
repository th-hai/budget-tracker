import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import fetcher, { postAPI } from '@/lib/api';
import { formatVNDShort } from '@/lib/format';
import PageShell from '@/components/layout/PageShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { L } from '@/lib/labels';

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
      <label className="text-[11px] font-semibold opacity-40 mb-2 block">{label}</label>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="0"
          className="input-brutal text-lg font-bold text-center !py-2.5 !pr-12"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-nero/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">k</span>
      </div>
      {value && Number(value) > 0 && (
        <div className="mt-2 text-center">
          <p className="text-xs font-medium opacity-40">
            = {(Number(value) * 1000).toLocaleString('vi-VN')}d
          </p>
          {dailyAllowance > 0 && (
            <p className="text-[11px] font-medium opacity-30 mt-0.5">
              ≈ {formatVNDShort(dailyAllowance)}/ngay
            </p>
          )}
        </div>
      )}
      {focused && (
        <div className="flex gap-1.5 flex-wrap mt-3">
          {presets.map((v) => (
            <button
              key={v}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(String(v)); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                value === String(v)
                  ? 'bg-yolk text-nero shadow-sm'
                  : 'bg-nero/5 text-nero/50 hover:bg-nero/10'
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
  const { data: summary } = useSWR(
    `/api/transactions/summary?month=${month}&year=${year}`,
    fetcher
  );

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
        month, year,
        totalBudget: Number(totalBudget) * 1000,
        savingGoal: (goal?.savingGoal) || 0,
      });
      setSavedBudget(true);
      setTimeout(() => setSavedBudget(false), 2000);
      revalidateAll();
    } catch (err) { console.error(err); }
    finally { setSavingBudget(false); }
  };

  const handleSaveSaving = async () => {
    setSavingSaving(true);
    try {
      await postAPI('/api/budget-goal', {
        month, year,
        totalBudget: (goal?.totalBudget) || 0,
        savingGoal: Number(savingGoal || 0) * 1000,
      });
      setSavedSaving(true);
      setTimeout(() => setSavedSaving(false), 2000);
      revalidateAll();
    } catch (err) { console.error(err); }
    finally { setSavingSaving(false); }
  };

  const handleMonthChange = (delta: number) => {
    let m = month + delta, y = year;
    if (m > 12) { m = 1; y++; } else if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const actualSaving = summary?.actualSaving || 0;
  const savingGoalAmount = Number(savingGoal || 0) * 1000;
  const savingPct = savingGoalAmount > 0 ? Math.round((actualSaving / savingGoalAmount) * 100) : 0;
  const savingBarColor = actualSaving >= savingGoalAmount ? '#3BB8B0' : savingPct >= 50 ? '#D4922A' : '#E85D5D';

  const [animatedPct, setAnimatedPct] = useState(0);
  useEffect(() => {
    setAnimatedPct(0);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimatedPct(Math.min(100, Math.max(0, savingPct))));
    });
    return () => cancelAnimationFrame(raf);
  }, [savingPct]);

  return (
    <PageShell title="Cai dat">
      <div className="space-y-5">
        {/* Month selector */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => handleMonthChange(-1)}
            className="w-9 h-9 rounded-xl bg-white border border-nero/10 flex items-center justify-center text-base font-bold text-nero/40 hover:text-nero/70 transition-colors"
            style={{ boxShadow: '0 1px 3px rgba(26,26,26,0.06)' }}
          >
            ‹
          </button>
          <span className="text-lg font-bold min-w-[130px] text-center">Tháng {month}/{year}</span>
          <button
            onClick={() => handleMonthChange(1)}
            className="w-9 h-9 rounded-xl bg-white border border-nero/10 flex items-center justify-center text-base font-bold text-nero/40 hover:text-nero/70 transition-colors"
            style={{ boxShadow: '0 1px 3px rgba(26,26,26,0.06)' }}
          >
            ›
          </button>
        </div>

        {/* Total budget */}
        <Card>
          <h2 className="text-sm font-bold mb-5">{L.settings.budgetTitle}</h2>
          <BudgetInput
            value={totalBudget}
            onChange={setTotalBudget}
            presets={BUDGET_PRESETS}
            label={L.settings.budgetLabel}
          />
          <Button
            onClick={handleSaveBudget}
            variant="teal"
            className="w-full mt-5"
            disabled={savingBudget || !totalBudget || Number(totalBudget) <= 0}
          >
            {savingBudget ? L.settings.saving : savedBudget ? L.settings.saved : L.settings.budgetSave}
          </Button>
        </Card>

        {/* Saving goal */}
        <Card>
          <h2 className="text-sm font-bold mb-5">{L.settings.savingTitle}</h2>
          <BudgetInput
            value={savingGoal}
            onChange={setSavingGoal}
            presets={SAVING_PRESETS}
            label={L.settings.savingLabel}
          />
          {savingGoalAmount > 0 && (
            <div className="mt-5">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[11px] font-semibold opacity-40">
                  {L.settings.savingProgress} {formatVNDShort(actualSaving)} / {formatVNDShort(savingGoalAmount)}
                </span>
                <span className="text-[11px] font-bold opacity-30">
                  {Math.max(0, savingPct)}%
                </span>
              </div>
              <div
                className="w-full h-3 rounded-full overflow-hidden"
                style={{ backgroundColor: '#DDDBD6', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${animatedPct}%`,
                    backgroundColor: savingBarColor,
                    transition: 'width 800ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                />
              </div>
              <p className="text-xs font-medium opacity-35 mt-2.5 text-center">
                {actualSaving >= savingGoalAmount
                  ? L.savingGoal.achieved(formatVNDShort(actualSaving - savingGoalAmount))
                  : savingPct >= 80
                    ? L.savingGoal.nearGoal(formatVNDShort(savingGoalAmount - actualSaving))
                    : L.savingGoal.inProgress(formatVNDShort(savingGoalAmount - actualSaving))}
              </p>
            </div>
          )}
          <Button
            onClick={handleSaveSaving}
            variant="teal"
            className="w-full mt-5"
            disabled={savingSaving}
          >
            {savingSaving ? L.settings.saving : savedSaving ? L.settings.saved : L.settings.savingSave}
          </Button>
        </Card>

      </div>
    </PageShell>
  );
}
