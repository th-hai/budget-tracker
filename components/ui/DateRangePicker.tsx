import { useState, useMemo } from 'react';
import BottomSheet from './BottomSheet';

interface DateRangePickerProps {
  open: boolean;
  onClose: () => void;
  onApply: (start: string, end: string) => void;
  initialStart?: string;
  initialEnd?: string;
}

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function pad(n: number) { return n < 10 ? `0${n}` : String(n); }
function toDateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function isBetween(d: Date, start: Date, end: Date) { return d >= start && d <= end; }

export default function DateRangePicker({ open, onClose, onApply, initialStart, initialEnd }: DateRangePickerProps) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [start, setStart] = useState<Date | null>(initialStart ? new Date(initialStart) : null);
  const [end, setEnd] = useState<Date | null>(initialEnd ? new Date(initialEnd) : null);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(viewYear, viewMonth, i));
    return days;
  }, [viewMonth, viewYear]);

  const handleDayClick = (day: Date) => {
    if (!start || (start && end)) {
      setStart(day);
      setEnd(null);
    } else {
      if (day < start) {
        setEnd(start);
        setStart(day);
      } else {
        setEnd(day);
      }
    }
  };

  const handleApply = () => {
    if (start) {
      onApply(toDateStr(start), toDateStr(end || start));
      onClose();
    }
  };

  const handleClear = () => {
    setStart(null);
    setEnd(null);
    onApply('', '');
    onClose();
  };

  const handleMonthNav = (delta: number) => {
    let m = viewMonth + delta, y = viewYear;
    if (m > 11) { m = 0; y++; } else if (m < 0) { m = 11; y--; }
    setViewMonth(m); setViewYear(y);
  };

  // Quick presets
  const presets = [
    { label: 'Hôm nay', fn: () => { const t = new Date(); setStart(t); setEnd(t); } },
    { label: '7 ngày', fn: () => { const t = new Date(); const s = new Date(t); s.setDate(s.getDate() - 6); setStart(s); setEnd(t); } },
    { label: '30 ngày', fn: () => { const t = new Date(); const s = new Date(t); s.setDate(s.getDate() - 29); setStart(s); setEnd(t); } },
    { label: 'Tháng này', fn: () => { const t = new Date(); setStart(new Date(t.getFullYear(), t.getMonth(), 1)); setEnd(t); } },
  ];

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h3 className="text-sm font-bold mb-4">Chọn khoảng thời gian</h3>

      {/* Quick presets */}
      <div className="flex gap-1.5 mb-4">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={p.fn}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-bold bg-nero/5 text-nero/50 hover:bg-nero/10 transition-all"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => handleMonthNav(-1)}
          className="w-8 h-8 rounded-lg bg-nero/5 flex items-center justify-center text-nero/40 hover:text-nero/70 transition-colors text-sm font-bold"
        >
          ‹
        </button>
        <span className="text-sm font-bold">Tháng {viewMonth + 1}/{viewYear}</span>
        <button
          onClick={() => handleMonthNav(1)}
          className="w-8 h-8 rounded-lg bg-nero/5 flex items-center justify-center text-nero/40 hover:text-nero/70 transition-colors text-sm font-bold"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold opacity-30 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 mb-4">
        {calendarDays.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;

          const isToday = isSameDay(day, today);
          const isStart = start && isSameDay(day, start);
          const isEnd = end && isSameDay(day, end);
          const isInRange = start && end && isBetween(day, start, end) && !isStart && !isEnd;
          const isSelected = isStart || isEnd;
          const isFuture = day > today;

          return (
            <button
              key={i}
              onClick={() => !isFuture && handleDayClick(day)}
              disabled={isFuture}
              className={`
                h-9 rounded-lg text-xs font-bold transition-all duration-100
                ${isSelected ? 'bg-teal text-white' : ''}
                ${isInRange ? 'bg-teal/15 text-teal' : ''}
                ${!isSelected && !isInRange && isToday ? 'bg-yolk/30' : ''}
                ${!isSelected && !isInRange && !isToday ? 'hover:bg-nero/5' : ''}
                ${isFuture ? 'opacity-20 cursor-not-allowed' : ''}
              `}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      {/* Selected range display */}
      {start && (
        <div className="text-center mb-4">
          <p className="text-xs font-semibold opacity-40">
            {pad(start.getDate())}/{pad(start.getMonth() + 1)}
            {end && !isSameDay(start, end) ? ` → ${pad(end.getDate())}/${pad(end.getMonth() + 1)}` : ''}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleClear}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-nero/5 text-nero/50 hover:bg-nero/10 transition-all"
        >
          Xoá bộ lọc
        </button>
        <button
          onClick={handleApply}
          disabled={!start}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-teal text-white disabled:opacity-30 transition-all"
        >
          Áp dụng
        </button>
      </div>
    </BottomSheet>
  );
}
