import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { getCategoryByKey } from '@/lib/categories';
import { formatVNDShort } from '@/lib/format';
import { L } from '@/lib/labels';

interface CategoryData {
  category: string;
  total: number;
  percentage: number;
  count?: number;
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

export default function CategoryPieChart({
  data,
  selectedCategory,
  onSelectCategory,
}: {
  data: CategoryData[];
  selectedCategory?: string | null;
  onSelectCategory?: (category: string) => void;
}) {
  const [hoverIndex, setHoverIndex] = useState(-1);

  if (data.length === 0) {
    return <div className="text-center py-10 text-sm font-semibold opacity-30">{L.dashboard.emptyChart}</div>;
  }

  // Recalculate percentages from actual totals (server-side % can be wrong when saving is excluded from totalExpense)
  const totalAmount = data.reduce((sum, d) => sum + d.total, 0);
  const withPct = data.map((d) => ({
    ...d,
    percentage: totalAmount > 0 ? Math.round((d.total / totalAmount) * 100) : 0,
  }));

  const merged = withPct;
  const maxPct = Math.max(...merged.map((d) => d.percentage));

  const chartData = merged.map((d) => {
    const cat = getCategoryByKey(d.category);
    return {
      category: d.category,
      name: cat?.label || d.category,
      value: d.total,
      color: cat?.color || '#B8BFC6',
      icon: cat?.icon || '📌',
      percentage: d.percentage,
      count: d.count || 0,
    };
  });

  const selectedIndex = selectedCategory
    ? chartData.findIndex((d) => d.category === selectedCategory)
    : -1;
  const activeIndex = hoverIndex >= 0 ? hoverIndex : selectedIndex;
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
              animationDuration={700}
              animationEasing="ease-out"
              onMouseEnter={(_, index) => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(-1)}
              onClick={(_, index) => onSelectCategory?.(chartData[index].category)}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color}
                  style={{
                    opacity: activeIndex >= 0 && activeIndex !== index ? 0.4 : 1,
                    filter: activeIndex === index ? 'drop-shadow(0 4px 8px rgba(26,26,26,0.12))' : 'none',
                    transition: 'opacity 220ms ease, filter 220ms ease',
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
              <span className="text-[11px] font-semibold opacity-40">
                {activeItem.percentage}% · {L.analytics.transactions(activeItem.count)}
              </span>
              <span className="text-[10px] font-bold opacity-30">{activeItem.icon} {activeItem.name}</span>
            </>
          ) : (
            <>
              <span className="text-lg font-bold">{formatVNDShort(totalAmount)}</span>
              <span className="text-[11px] font-semibold opacity-40">{L.dashboard.totalSpending}</span>
            </>
          )}
        </div>
      </div>

      {/* Category breakdown bars */}
      <div className="mt-2 space-y-0.5">
        {chartData.map((entry, i) => {
          const cat = { icon: entry.icon, label: entry.name, color: entry.color };
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectCategory?.(entry.category)}
              className={`w-full rounded-xl px-2 transition-all duration-200 active:scale-[0.98] ${
                selectedCategory === entry.category ? 'bg-nero/[0.03]' : 'hover:bg-nero/[0.02]'
              }`}
            >
              <BreakdownBar
                cat={cat}
                total={entry.value}
                percentage={entry.percentage}
                maxPct={maxPct}
                index={i}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
