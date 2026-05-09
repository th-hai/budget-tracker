import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, TooltipProps,
} from 'recharts';
import { formatVNDShort } from '@/lib/format';

interface DailyData { date: string; income: number; expense: number; }

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const expense = payload.find((p) => p.dataKey === 'expenseK');
  const income = payload.find((p) => p.dataKey === 'incomeK');

  return (
    <div
      className="bg-white rounded-xl px-3 py-2 border-2 border-nero/15"
      style={{ boxShadow: '2px 2px 0 rgba(26,26,26,0.08)' }}
    >
      <p className="text-[11px] font-semibold opacity-40 mb-1">Ngày {label}</p>
      {expense && Number(expense.value) > 0 && (
        <p className="text-xs font-bold text-coral">Chi: {formatVNDShort(Number(expense.value) * 1000)}</p>
      )}
      {income && Number(income.value) > 0 && (
        <p className="text-xs font-bold text-teal">Thu: {formatVNDShort(Number(income.value) * 1000)}</p>
      )}
    </div>
  );
}

function CustomDot(props: any) {
  const { cx, cy, index, activeIndex, color } = props;
  if (cy === null || cy === undefined) return null;
  const isActive = index === activeIndex;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isActive ? 5 : 3}
      fill={isActive ? color : 'white'}
      stroke={color}
      strokeWidth={2}
      style={{ transition: 'r 200ms ease, fill 200ms ease' }}
    />
  );
}

export default function SpendingLineChart({ data }: { data: DailyData[] }) {
  const [activeIndex, setActiveIndex] = useState(-1);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="flex gap-1 mb-3 opacity-20">
          {[20, 35, 25, 45, 30, 40, 20].map((h, i) => (
            <div
              key={i}
              className="w-4 rounded-full bg-nero/20"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
        <p className="text-sm font-semibold opacity-30">Chưa có dữ liệu chi tiêu</p>
        <p className="text-xs font-medium opacity-20 mt-0.5">Thêm giao dịch để xem biểu đồ</p>
      </div>
    );
  }

  // If only 1 data point, show a simple summary instead of a chart
  if (data.length === 1) {
    const d = data[0];
    const day = new Date(d.date).getDate();
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-xs font-semibold opacity-40 mb-1">Ngày {day}</p>
        <div className="flex gap-4">
          {d.expense > 0 && (
            <div className="text-center">
              <p className="text-xs font-medium opacity-40">Chi tiêu</p>
              <p className="text-base font-bold text-coral">{formatVNDShort(d.expense)}</p>
            </div>
          )}
          {d.income > 0 && (
            <div className="text-center">
              <p className="text-xs font-medium opacity-40">Thu nhập</p>
              <p className="text-base font-bold text-teal">{formatVNDShort(d.income)}</p>
            </div>
          )}
        </div>
        <p className="text-xs font-medium opacity-20 mt-3">Cần thêm dữ liệu để xem xu hướng</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    day: new Date(d.date).getDate(),
    expenseK: Math.round(d.expense / 1000),
    incomeK: Math.round(d.income / 1000),
  }));

  const hasExpense = chartData.some((d) => d.expenseK > 0);
  const hasIncome = chartData.some((d) => d.incomeK > 0);

  // Show ~7 ticks max on x-axis
  const tickInterval = chartData.length <= 7 ? 0 : Math.floor(chartData.length / 6);

  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 4, bottom: 0, left: -12 }}
          onMouseMove={(state) => {
            if (state?.activeTooltipIndex !== undefined) {
              setActiveIndex(state.activeTooltipIndex);
            }
          }}
          onMouseLeave={() => setActiveIndex(-1)}
        >
          <defs>
            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F29191" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#F29191" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3BB8B0" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#3BB8B0" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(26,26,26,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fontWeight: 600, fill: 'rgba(26,26,26,0.35)' }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
          />
          <YAxis
            tick={{ fontSize: 10, fontWeight: 600, fill: 'rgba(26,26,26,0.35)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}k`}
            width={36}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(26,26,26,0.08)', strokeWidth: 1 }}
          />
          {hasExpense && (
            <Area
              type="monotone"
              dataKey="expenseK"
              stroke="#E85D5D"
              strokeWidth={2.5}
              fill="url(#expGrad)"
              dot={(props: any) => (
                <CustomDot {...props} activeIndex={activeIndex} color="#E85D5D" />
              )}
              activeDot={false}
              animationDuration={800}
              animationEasing="ease-out"
            />
          )}
          {hasIncome && (
            <Area
              type="monotone"
              dataKey="incomeK"
              stroke="#3BB8B0"
              strokeWidth={2.5}
              fill="url(#incGrad)"
              dot={(props: any) => (
                <CustomDot {...props} activeIndex={activeIndex} color="#3BB8B0" />
              )}
              activeDot={false}
              animationDuration={800}
              animationEasing="ease-out"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center gap-5 mt-2">
        {hasExpense && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#E85D5D' }} />
            <span className="text-[11px] font-semibold opacity-40">Chi tiêu</span>
          </div>
        )}
        {hasIncome && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3BB8B0' }} />
            <span className="text-[11px] font-semibold opacity-40">Thu nhập</span>
          </div>
        )}
      </div>
    </div>
  );
}
