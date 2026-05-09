import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { getCategoryByKey } from '@/lib/categories';
import { formatVNDShort } from '@/lib/format';

interface CategoryData {
  category: string;
  total: number;
  percentage: number;
}

const SMALL_THRESHOLD = 3; // merge categories below 3% into "Khac"

function mergeSmallCategories(data: CategoryData[]): CategoryData[] {
  const main: CategoryData[] = [];
  let otherTotal = 0;
  let otherPct = 0;

  data.forEach((d) => {
    if (d.percentage < SMALL_THRESHOLD && d.category !== 'saving') {
      otherTotal += d.total;
      otherPct += d.percentage;
    } else {
      main.push(d);
    }
  });

  // Merge into existing "other" or create one
  if (otherTotal > 0) {
    const existingOther = main.find((d) => d.category === 'other');
    if (existingOther) {
      existingOther.total += otherTotal;
      existingOther.percentage += otherPct;
    } else {
      main.push({ category: 'other', total: otherTotal, percentage: otherPct });
    }
  }

  return main;
}

function ActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="white"
        strokeWidth={2}
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }}
      />
    </g>
  );
}

function BreakdownBar({ cat, total, percentage, maxPct, index }: {
  cat: { icon: string; label: string; color: string };
  total: number;
  percentage: number;
  maxPct: number;
  index: number;
}) {
  const [animated, setAnimated] = useState(0);
  const barWidth = maxPct > 0 ? (percentage / maxPct) * 100 : 0;

  useEffect(() => {
    setAnimated(0);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimated(barWidth));
    });
    return () => cancelAnimationFrame(raf);
  }, [barWidth]);

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-base shrink-0 w-6 text-center">{cat.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-sm font-bold truncate">{cat.label}</span>
          <div className="flex items-baseline gap-1.5 shrink-0 ml-2">
            <span className="text-sm font-bold">{formatVNDShort(total)}</span>
            <span className="text-[11px] font-semibold opacity-35">{percentage}%</span>
          </div>
        </div>
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: '#ECEAE5' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${animated}%`,
              backgroundColor: cat.color,
              transition: `width ${600 + index * 80}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function CategoryPieChart({ data }: { data: CategoryData[] }) {
  const [activeIndex, setActiveIndex] = useState(-1);

  if (data.length === 0) {
    return <div className="text-center py-10 text-sm font-semibold opacity-30">Chưa có dữ liệu chi tiêu</div>;
  }

  // Recalculate percentages from actual totals (server-side % can be wrong when saving is excluded from totalExpense)
  const totalAmount = data.reduce((sum, d) => sum + d.total, 0);
  const withPct = data.map((d) => ({
    ...d,
    percentage: totalAmount > 0 ? Math.round((d.total / totalAmount) * 100) : 0,
  }));

  const merged = mergeSmallCategories(withPct);
  const maxPct = Math.max(...merged.map((d) => d.percentage));

  const chartData = merged.map((d) => {
    const cat = getCategoryByKey(d.category);
    return {
      name: cat?.label || d.category,
      value: d.total,
      color: cat?.color || '#B8BFC6',
      icon: cat?.icon || '📌',
      percentage: d.percentage,
    };
  });

  const activeItem = activeIndex >= 0 ? chartData[activeIndex] : null;

  return (
    <div>
      {/* Donut chart with center label */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              stroke="white"
              strokeWidth={2}
              activeIndex={activeIndex >= 0 ? activeIndex : undefined}
              activeShape={ActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
              onClick={(_, index) => setActiveIndex(activeIndex === index ? -1 : index)}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color}
                  style={{
                    opacity: activeIndex >= 0 && activeIndex !== index ? 0.4 : 1,
                    transition: 'opacity 200ms ease',
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {activeItem ? (
            <>
              <span className="text-lg font-bold">{formatVNDShort(activeItem.value)}</span>
              <span className="text-[11px] font-semibold opacity-40">{activeItem.icon} {activeItem.name}</span>
            </>
          ) : (
            <>
              <span className="text-lg font-bold">{formatVNDShort(totalAmount)}</span>
              <span className="text-[11px] font-semibold opacity-40">Tổng chi</span>
            </>
          )}
        </div>
      </div>

      {/* Category breakdown bars */}
      <div className="mt-2 space-y-0.5">
        {chartData.map((entry, i) => {
          const cat = { icon: entry.icon, label: entry.name, color: entry.color };
          return (
            <BreakdownBar
              key={i}
              cat={cat}
              total={entry.value}
              percentage={entry.percentage}
              maxPct={maxPct}
              index={i}
            />
          );
        })}
      </div>
    </div>
  );
}
