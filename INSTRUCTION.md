# Budget Tracker — LLM Context Document

This document provides complete context about the Budget Tracker project for LLM-assisted development.

---

## 1. Project Purpose

Personal budget tracker PWA for a single Vietnamese user. All UI text is in Vietnamese with proper diacritics. Currency is VND (Vietnamese Dong), displayed with `k` (thousands) and `tr` (millions) shorthand.

Three input channels:
1. **Web UI** — Dashboard + transaction history (read-only, no manual add form)
2. **Telegram Bot** — Primary input method for adding transactions
3. **SePay Bank Webhook** — Auto-records bank transactions (MBBank, etc.)

---

## 2. Tech Stack

- **Next.js 14** — Pages Router (NOT App Router)
- **TypeScript** — Strict mode
- **Tailwind CSS 3** — With custom config (NOT v4)
- **MongoDB** — Via Mongoose ODM, hosted on Atlas
- **SWR** — Client-side data fetching with 30s refresh
- **Recharts** — Charts (AreaChart, PieChart)
- **next-pwa** — PWA support, disabled in dev mode
- **Vercel** — Hosting + Cron Jobs

---

## 3. Design System

**Style: Soft modern fintech with retro pastel identity.**

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| cream | #FFFDF7 | Page background |
| nero | #1a1a1a | Text, borders (at low opacity) |
| teal | #4ECDC4 | Income, positive values, CTAs |
| coral | #FF6B6B | Expenses, negative values |
| yolk | #FFE156 | Highlights, active states |
| amber | #F59E0B | Warnings |

### Typography
- Font: **Space Grotesk** (400, 500, 600, 700)
- `font-variant-numeric: tabular-nums` globally
- Hierarchy: bold titles → semibold labels → medium helper text
- NO ALL CAPS — use sentence case everywhere

### Cards
- `border border-nero/10`, `rounded-2xl`, soft layered box-shadow
- NOT heavy black borders — keep it lightweight

### Buttons
- Primary actions: `bg-teal`, soft shadow, no hard borders
- Filter chips: `bg-nero/5` inactive → `bg-white shadow-sm` active (segmented control pattern)
- Pressed: `active:scale-[0.98]`

### Progress Bars
- Track: `#DDDBD6` with `inset` shadow
- Fill colors: teal (healthy) → `#D4922A` amber (warning) → `#E85D5D` (danger)
- Animate from 0 on mount: double `requestAnimationFrame` → CSS `transition: width 800ms`

### Bottom Sheet Modal
- Slide-up from bottom, 300ms animation
- Drag-to-close (swipe down >100px)
- Rounded top corners, drag handle pill
- Used for transaction details

---

## 4. Data Models

### Transaction
```typescript
{
  type: 'income' | 'expense',
  amount: number,           // in VND (e.g., 50000)
  category: string,         // 'food', 'transport', 'saving', 'income', etc.
  note: string,
  source: 'manual_ui' | 'manual_telegram' | 'bank_webhook',
  bankData?: { sepayId, gateway, accountNumber, referenceCode, ... },
  transactionDate: Date,
  categorized: boolean,     // false = awaiting category selection
}
```

### BudgetGoal
```typescript
{
  month: number,
  year: number,
  totalBudget: number,      // monthly spending limit in VND
  savingGoal: number,       // monthly saving target in VND
  categoryBudgets: [{ category: string, amount: number }],
}
```

### PendingTransaction
SePay webhook raw data with dedup index and Telegram message tracking.

---

## 5. Categories

9 expense categories + saving + income:

| Key | Label | Icon |
|-----|-------|------|
| food | Ăn uống | 🍜 |
| transport | Di chuyển | 🚗 |
| entertainment | Giải trí | 🎮 |
| bills | Hoá đơn & Thuế | 🏠 |
| subscriptions | Đăng ký | 📱 |
| health | Sức khoẻ | 💊 |
| shopping | Mua sắm | 🛍 |
| gifts | Quà tặng | 🎁 |
| other | Khác | 📌 |
| saving | Tiết kiệm | 🏦 |
| income | Thu nhập | 💰 |

Defined in `lib/categories.ts`. Colors are soft pastels.

---

## 6. Saving Logic

**Saving is NOT `income - expenses`.** It's tracked as its own category.

- Stored as `type: 'expense'` with `category: 'saving'`
- Input via Telegram: `saving 500k`
- **Excluded from**: totalExpense, balance, budget remaining, daily spending chart
- **Included in**: category pie chart (as a slice)
- **Displayed as**: green/positive in transaction list (not red like expenses)
- **Progress**: settings page shows actual saving vs saving goal

---

## 7. Telegram Bot Flow

### Adding transactions
```
banh mi 50k       → expense, asks for category via inline keyboard
luong +5000k      → income, auto-saved
saving 500k       → saving, auto-saved
```

### Category selection
After expense input, bot sends inline keyboard (3 columns + saving + edit note).
User taps category → transaction updated, message edited to confirmation.

### Edit note
"✏️ Sửa ghi chú" button → bot sends force_reply with `#note_<txId>` tag.
User replies with new note → bot matches reply, updates transaction.

### Commands
- `/start` — Usage guide
- `/today` — Today's summary (income, expense, transaction list)
- `/month` — Month summary (income, expense, balance)

### Bank webhook notifications
SePay POST → save transaction → notify via Telegram with category keyboard (expense) or confirmation (income).

Bank note parsing (`lib/parse-bank-note.ts`):
- `MOMO-CASHIN-...` → `MOMO rút tiền`
- `ZaloPay-CASHIN-...` → `ZaloPay rút tiền`
- `NGUYEN THANH HAI` → `Hải` (owner name replacement)
- Strips MBVCB/MBCT prefixes, reference codes, etc.

---

## 8. API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/transactions` | GET | List with pagination, filters (month, year, startDate, endDate, category, type, wallet) |
| `/api/transactions` | POST | Create transaction |
| `/api/transactions/[id]` | GET/PUT/DELETE | Single transaction CRUD |
| `/api/transactions/summary` | GET | Aggregated stats: totals, category breakdown, daily spending, budget, saving |
| `/api/budget-goal` | GET/POST | Get/upsert monthly budget goal |
| `/api/webhook/telegram` | POST | Telegram bot webhook handler |
| `/api/webhook/sepay` | POST | SePay bank webhook (requires `Authorization: Apikey` header) |
| `/api/cron/evening-reminder` | GET | Vercel cron: remind uncategorized transactions at 20:00 VN time |

### Summary API special behavior
- `range` param: `today`, `week`, `month` (default)
- Saving transactions (`category: 'saving'`) excluded from totals/daily chart but included in category breakdown
- Returns `actualSaving` from saving-categorized transactions (not income - expense)

---

## 9. Labels & i18n

All user-facing text is centralized in `lib/labels.ts` as `L` object:

```typescript
import { L } from '@/lib/labels';

L.nav.dashboard        // 'Tổng quan'
L.dashboard.income     // 'Thu nhập'
L.telegram.savingConfirm('500')  // '🏦 Đã tiết kiệm 500k'
L.budget.onTrack('200k')         // 'Đang chi tiêu đúng kế hoạch · ≈ 200k/ngày'
```

Sections: `nav`, `dashboard`, `transactions`, `wallets`, `settings`, `budget`, `savingGoal`, `date`, `detail`, `source`, `telegram`.

To change any label, edit only `lib/labels.ts`.

---

## 10. Pages

### Dashboard (`pages/index.tsx`)
1. Period selector (segmented control: Hôm nay / Tuần này / Tháng này)
2. Balance hero card (dynamic color based on financial state)
3. Inline income/expense row inside balance card
4. Budget progress card (with daily allowance insight)
5. Daily spending area chart
6. Category donut chart + breakdown bars
7. Recent transactions grouped by smart date headers
8. Bottom sheet on transaction tap

### Transactions (`pages/transactions.tsx`)
1. Month selector (arrows) or custom date range picker
2. Type filter (segmented control)
3. Category filter (scrollable chips)
4. Wallet filter (MoMo, ZaloPay, VNPay, Apple Pay)
5. Transaction list grouped by date with daily totals
6. Pagination
7. Bottom sheet detail on tap

### Settings (`pages/settings.tsx`)
1. Month selector
2. Budget card (input + presets + save button)
3. Saving goal card (input + presets + progress bar + save button)
4. Telegram bot info
5. SePay webhook URL

---

## 11. Key Conventions

- **Vietnamese with diacritics** in all labels (Thu nhập, not Thu nhap)
- **VND formatting**: `50.000đ`, `50k`, `5tr` via `lib/format.ts`
- **No add page** — transactions are added only via Telegram or bank webhook
- **SWR** for all client data fetching, 30s refresh interval
- **Soft UI** — no heavy borders, use opacity and shadows for hierarchy
- **Mobile-first** — max-w-lg centered layout, bottom nav, touch-friendly
- **Animations** — progress bars animate from 0, charts have 800ms ease-out, bottom sheet slides up

---

## 12. Environment & Hosting

- **Dev**: `npm run dev` (port 3000), next-pwa disabled
- **Build**: `npm run build` (webpack, not Turbopack)
- **Deploy**: Vercel, auto-deploy from GitHub
- **Cron**: `vercel.json` defines evening reminder at `0 13 * * *` (20:00 UTC+7)
- **ngrok**: For local Telegram webhook testing, tunnel to port 3000

---

## 13. File Naming

- Pages: `pages/*.tsx` (Pages Router)
- API: `pages/api/**/*.ts`
- Components: PascalCase (`TransactionCard.tsx`)
- Libs: camelCase (`parse-bank-note.ts`)
- Models: PascalCase (`Transaction.ts`)
