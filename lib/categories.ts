export interface Category {
  key: string;
  label: string;
  icon: string;
  color: string;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { key: 'food', label: 'Ăn uống', icon: '🍜', color: '#F4A98A' },
  { key: 'transport', label: 'Di chuyển', icon: '🚗', color: '#89C4F4' },
  { key: 'entertainment', label: 'Giải trí', icon: '🎮', color: '#B8A9E8' },
  { key: 'bills', label: 'Hoá đơn & Thuế', icon: '🏠', color: '#F29191' },
  { key: 'subscriptions', label: 'Đăng ký', icon: '📱', color: '#8DD5A0' },
  { key: 'health', label: 'Sức khoẻ', icon: '💊', color: '#7ECBDB' },
  { key: 'shopping', label: 'Mua sắm', icon: '🛍', color: '#F0D87A' },
  { key: 'gifts', label: 'Quà tặng', icon: '🎁', color: '#D4A4E8' },
  { key: 'other', label: 'Khác', icon: '📌', color: '#B8BFC6' },
];

export const SAVING_CATEGORY: Category = {
  key: 'saving',
  label: 'Tiết kiệm',
  icon: '🏦',
  color: '#7EC8A0',
};

export const INCOME_CATEGORY: Category = {
  key: 'income',
  label: 'Thu nhập',
  icon: '💰',
  color: '#7EC8A0',
};

export const ALL_CATEGORIES: Category[] = [...EXPENSE_CATEGORIES, SAVING_CATEGORY, INCOME_CATEGORY];

export function getCategoryByKey(key: string): Category | undefined {
  return ALL_CATEGORIES.find((c) => c.key === key);
}
