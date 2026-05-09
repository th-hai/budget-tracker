# Budget Tracker 💰

Ứng dụng quản lý chi tiêu cá nhân PWA với giao diện tiếng Việt, hỗ trợ nhập giao dịch qua Telegram Bot và webhook ngân hàng SePay.

## Tính năng

- **Dashboard** — Tổng quan số dư, thu nhập, chi tiêu với biểu đồ tương tác
- **Telegram Bot** — Nhập giao dịch nhanh: `banh mi 50k`, `luong +5000k`, `saving 500k`
- **Webhook ngân hàng** — Tự động ghi nhận giao dịch từ SePay (MBBank, Vietcombank, ...)
- **Phân loại thông minh** — 9 danh mục chi tiêu + tiết kiệm, chọn qua inline keyboard
- **Ngân sách & tiết kiệm** — Đặt mục tiêu theo tháng, theo dõi tiến độ
- **Biểu đồ** — Donut chart danh mục, area chart theo ngày, progress bar ngân sách
- **PWA** — Cài đặt như app native trên điện thoại
- **Nhắc nhở** — Cron job nhắc phân loại giao dịch mỗi tối 20:00

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (Pages Router) + TypeScript |
| Styling | Tailwind CSS 3 + Space Grotesk font |
| Database | MongoDB (Mongoose) |
| Data Fetching | SWR |
| Charts | Recharts |
| PWA | next-pwa |
| Hosting | Vercel |
| Bot | Telegram Bot API (webhook mode) |
| Bank | SePay webhook |

## Cài đặt

```bash
# Clone & install
git clone <repo-url>
cd budget-tracker
npm install

# Tạo file .env.local
cp .env.local.example .env.local
# Sửa các giá trị trong .env.local

# Chạy dev server
npm run dev
```

## Biến môi trường

```
MONGODB_URI=mongodb+srv://...
TELEGRAM_BOT_TOKEN=<bot_token>
TELEGRAM_CHAT_ID=<your_chat_id>
SEPAY_API_KEY=<sepay_api_key>
CRON_SECRET=<random_string>
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Telegram Bot

Đăng ký webhook sau khi deploy:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<APP_URL>/api/webhook/telegram"
```

**Cách dùng:**

| Format | Loại | Ví dụ |
|--------|------|-------|
| `ghi_chú số_tiền` | Chi tiêu | `banh mi 50k` |
| `ghi_chú +số_tiền` | Thu nhập | `luong +5000k` |
| `saving số_tiền` | Tiết kiệm | `saving 500k` |

**Lệnh:**
- `/start` — Hướng dẫn sử dụng
- `/today` — Tổng kết hôm nay
- `/month` — Tổng kết tháng này

## Deploy Vercel

1. Push code lên GitHub
2. Import project trên Vercel
3. Thêm biến môi trường
4. Deploy
5. Đăng ký Telegram webhook với URL mới
6. Cấu hình SePay webhook: `https://<APP_URL>/api/webhook/sepay`

## Cấu trúc thư mục

```
├── components/
│   ├── charts/         # BudgetProgressCard, CategoryPieChart, SpendingLineChart
│   ├── layout/         # BottomNav, PageShell
│   ├── transaction/    # TransactionCard, TransactionList, TransactionDetail
│   └── ui/             # Button, Card, ProgressBar, BottomSheet, DateRangePicker
├── lib/
│   ├── api.ts          # SWR fetcher + postAPI/putAPI/deleteAPI
│   ├── categories.ts   # Danh mục chi tiêu (icon, color, label)
│   ├── format.ts       # Format VND, ngày tháng
│   ├── labels.ts       # Tất cả text UI + Telegram messages
│   ├── mongodb.ts      # Mongoose connection
│   ├── parse-bank-note.ts  # Parse nội dung giao dịch ngân hàng
│   └── telegram.ts     # Telegram API helpers
├── models/
│   ├── BudgetGoal.ts
│   ├── PendingTransaction.ts
│   └── Transaction.ts
├── pages/
│   ├── api/
│   │   ├── budget-goal/
│   │   ├── cron/evening-reminder.ts
│   │   ├── transactions/
│   │   └── webhook/    # sepay.ts, telegram.ts
│   ├── index.tsx       # Dashboard
│   ├── transactions.tsx
│   └── settings.tsx
└── styles/globals.css
```

## License

Private project.
