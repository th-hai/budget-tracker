const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Convert a date to YYYY-MM-DD string in Vietnam timezone (UTC+7) */
export function toVNDateKey(date: Date | string): string {
  const d = new Date(date);
  const vn = new Date(d.getTime() + VN_OFFSET_MS);
  return vn.toISOString().split('T')[0];
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

export function formatVNDShort(amount: number): string {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'tr';
  }
  if (amount >= 1_000) {
    return (amount / 1_000).toFixed(0) + 'k';
  }
  return amount.toString() + 'đ';
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getMonthLabel(month: number, year: number): string {
  return `Thang ${month}/${year}`;
}

export function formatDateSmart(date: Date | string): string {
  // Import inline to avoid circular deps at module level
  const { L } = require('./labels');
  const todayKey = toVNDateKey(new Date());
  const targetKey = toVNDateKey(date);
  const diff = (new Date(todayKey).getTime() - new Date(targetKey).getTime()) / (1000 * 60 * 60 * 24);
  const days = Math.round(diff);

  if (days === 0) return L.date.today;
  if (days === 1) return L.date.yesterday;
  if (days < 7) return L.date.daysAgo(days);
  const [, m, d] = targetKey.split('-').map(Number);
  return `${d} Tháng ${m}`;
}

export function formatSourceLabel(source: string): string {
  const { L } = require('./labels');
  return L.source[source as keyof typeof L.source] || source;
}
