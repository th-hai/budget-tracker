/**
 * Predefined note → category mappings.
 * When a Telegram note matches, auto-categorize without asking.
 * All matching is case-insensitive.
 */

interface NoteRule {
  pattern: RegExp;
  category: string;
}

const RULES: NoteRule[] = [
  // Ăn uống
  { pattern: /^(cafe|coffee|cà phê)$/i, category: 'food' },
  { pattern: /^bánh mì$/i, category: 'food' },
  { pattern: /^cơm$/i, category: 'food' },
  { pattern: /^bún$/i, category: 'food' },
  { pattern: /^phở$/i, category: 'food' },
  { pattern: /^mì$/i, category: 'food' },
  { pattern: /^trà$/i, category: 'food' },
  { pattern: /^nước$/i, category: 'food' },

  // Di chuyển
  { pattern: /^(taxi|grab|be|xanhsm)$/i, category: 'transport' },
  { pattern: /^xăng$/i, category: 'transport' },
  { pattern: /^vé$/i, category: 'transport' },

  // Hoá đơn & Thuế
  { pattern: /^phòng$/i, category: 'bills' },

  // Mua sắm
  { pattern: /^shopping$/i, category: 'shopping' },
  { pattern: /^siêu thị$/i, category: 'shopping' },
  { pattern: /^đi chợ$/i, category: 'shopping' },
  { pattern: /^mua\s+.+/i, category: 'shopping' },

  // Đăng ký
  { pattern: /^(gg photos|ai)$/i, category: 'subscriptions' },
];

/**
 * Match a note against predefined rules.
 * Returns category key if matched, null otherwise.
 */
export function matchNoteCategory(note: string): string | null {
  const trimmed = note.trim();
  for (const rule of RULES) {
    if (rule.pattern.test(trimmed)) {
      return rule.category;
    }
  }
  return null;
}
