// ============================================
// UI Labels — all user-facing text in one place
// ============================================

export const L = {
  // Navigation
  nav: {
    dashboard: 'Tổng quan',
    transactions: 'Giao dịch',
    settings: 'Cài đặt',
  },

  // Dashboard
  dashboard: {
    title: 'Tổng quan',
    balanceLabel: 'Số dư',
    balanceToday: 'Số dư hôm nay',
    balanceWeek: 'Số dư tuần này',
    balanceMonth: 'Số dư tháng này',
    income: 'Thu nhập',
    expense: 'Chi tiêu',
    filterToday: 'Hôm nay',
    filterWeek: 'Tuần này',
    filterMonth: 'Tháng này',
    chartDaily: 'Chi tiêu theo ngày',
    chartCategory: 'Chi tiêu theo danh mục',
    recentTitle: 'Giao dịch gần đây',
    recentViewAll: 'Xem tất cả →',
    emptyTransactions: 'Chưa có giao dịch',
    emptyTransactionsHint: 'Gửi tin nhắn Telegram để thêm',
    emptyChart: 'Chưa có dữ liệu chi tiêu',
    emptyChartHint: 'Thêm giao dịch để xem biểu đồ',
    emptyChartSparse: 'Cần thêm dữ liệu để xem xu hướng',
    totalSpending: 'Tổng chi',
  },

  // Transactions page
  transactions: {
    filterAll: 'Tất cả',
    filterExpense: 'Chi tiêu',
    filterIncome: 'Thu nhập',
    prevPage: 'Trước',
    nextPage: 'Sau',
    dateRange: 'Chọn ngày',
    dateRangeActive: 'Lọc ngày',
    walletAll: 'Tất cả',
    emptyList: 'Chưa có giao dịch nào',
    emptyListHint: 'Gửi tin nhắn Telegram để thêm',
  },

  // Digital wallets
  wallets: [
    { key: '', label: 'Tất cả', icon: '💳' },
    { key: 'momo', label: 'MoMo', icon: '🟣' },
    { key: 'zalopay', label: 'ZaloPay', icon: '🔵' },
    { key: 'vnpay', label: 'VNPay', icon: '🔴' },
    { key: 'applepay', label: 'Apple Pay', icon: '🍎' },
  ],

  // Settings
  settings: {
    title: 'Cài đặt',
    budgetTitle: 'Ngân sách tháng',
    budgetLabel: 'Hạn mức chi tiêu',
    budgetSave: 'Lưu ngân sách',
    savingTitle: 'Mục tiêu tiết kiệm',
    savingLabel: 'Tiết kiệm mỗi tháng',
    savingSave: 'Lưu mục tiêu',
    savingProgress: 'Đã tiết kiệm',
    saving: 'Đang lưu...',
    saved: 'Đã lưu!',
    telegramTitle: 'Telegram Bot',
    telegramHint: 'Nhập giao dịch nhanh qua Telegram:',
    sepayTitle: 'Webhook ngân hàng (SePay)',
    sepayHint: 'Cấu hình webhook URL trong SePay dashboard:',
  },

  // Budget
  budget: {
    label: 'Ngân sách',
    remaining: 'Còn lại',
    emptyTitle: 'Chưa đặt mục tiêu ngân sách',
    emptyAction: 'Đặt ngay →',
    overBudget: (amount: string) => `Vượt ngân sách ${amount}`,
    nearLimit: (amount: string) => `Chỉ còn ${amount} nữa thôi`,
    onTrack: (daily: string) => `Đang chi tiêu đúng kế hoạch · ≈ ${daily}/ngày`,
    offTrack: (daily: string) => `Chi tiêu nhanh hơn dự kiến · ≈ ${daily}/ngày`,
  },

  // Saving
  savingGoal: {
    achieved: (surplus: string) => `Tuyệt vời! Vượt mục tiêu ${surplus}`,
    nearGoal: (remaining: string) => `Chỉ còn ${remaining} nữa thôi`,
    inProgress: (remaining: string) => `Còn ${remaining} để đạt mục tiêu`,
  },

  // Date labels
  date: {
    today: 'Hôm nay',
    yesterday: 'Hôm qua',
    daysAgo: (n: number) => `${n} ngày trước`,
    perDay: '/ngày',
  },

  // Transaction detail
  detail: {
    category: 'Danh mục',
    type: 'Loại',
    typeIncome: 'Thu nhập',
    typeExpense: 'Chi tiêu',
    typeSaving: 'Tiết kiệm',
    date: 'Ngày',
    time: 'Giờ',
    source: 'Nguồn',
    bank: 'Ngân hàng',
    refCode: 'Mã giao dịch',
  },

  // Sources
  source: {
    manual_telegram: 'Telegram',
    bank_webhook: 'Ngân hàng',
    manual_ui: 'Thủ công',
  },

  // Telegram bot messages
  telegram: {
    startTitle: '💰 <b>Budget Tracker</b>',
    startBody:
      'Ghi giao dịch theo format:\n' +
      '<code>ghi_chu so_tien</code>\n\n' +
      'Ví dụ:\n' +
      '🍜 <code>banh mi 50k</code> — chi tiêu\n' +
      '💵 <code>luong +5000k</code> — thu nhập\n' +
      '🏦 <code>saving 500k</code> — tiết kiệm\n\n' +
      '📌 <b>Lệnh nhanh</b>\n' +
      '/today — Tổng kết hôm nay\n' +
      '/month — Tổng kết tháng này',
    unknownFormat:
      '❌ Không hiểu giao dịch.\n\n' +
      'Nhập theo format:\n' +
      '<code>ghi_chu so_tien</code>\n\n' +
      'Ví dụ:\n' +
      '<code>banh mi 50k</code>',
    savingConfirm: (amount: string) =>
      `🏦 Đã tiết kiệm <b>${amount}k</b>`,
    incomeConfirm: (amount: string, note: string) =>
      `💵 <b>Thu nhập</b>\n` +
      `+${amount}k\n` +
      `📝 ${note}`,
    expenseAsk: (amount: string, note: string) =>
      `💸 <b>Chi tiêu</b>\n` +
      `-${amount}k\n` +
      `📝 ${note}\n\n` +
      `📂 Chọn danh mục:`,
    categorized: (amount: string, catLabel: string, note: string) =>
      `✅ <b>Đã ghi nhận</b>\n` +
      `${catLabel} • -${amount}k\n` +
      `📝 ${note}`,
    autoCategorized: (amount: string, catLabel: string, note: string) =>
      `✅ <b>Đã ghi nhận</b>\n` +
      `${catLabel} • -${amount}k\n` +
      `📝 ${note}`,
    undone: '🗑 Đã hoàn tác giao dịch.',
    undoExpired: 'Giao dịch không tồn tại hoặc đã bị xoá.',
    noteUpdated: (amount: string, catLabel: string, note: string) =>
      `✏️ <b>Đã cập nhật</b>\n` +
      `${catLabel} • -${amount}k\n` +
      `📝 ${note}`,
    noteUpdatedAsk: (amount: string, note: string) =>
      `✏️ <b>Đã cập nhật ghi chú</b>\n` +
      `${amount}k\n` +
      `📝 ${note}\n\n` +
      `📂 Chọn danh mục:`,
    editNotePrompt: (amount: string, txId: string) =>
      `✏️ <b>Sửa ghi chú</b>\n\n` +
      `Giao dịch: <b>${amount}k</b>\n` +
      `Reply:\n` +
      `<code>#note_${txId}</code>`,
    txNotFound: '❌ Không tìm thấy giao dịch.',
    todayTitle: '📅 <b>Tổng kết hôm nay</b>',
    todayEmpty: '🫥 Hôm nay chưa có giao dịch nào.',
    todayIncome: (k: number) =>
      `💵 Thu nhập: <b>+${k}k</b>`,
    todayExpense: (k: number) =>
      `💸 Chi tiêu: <b>-${k}k</b>`,
    monthTitle: (m: number, y: number) =>
      `📊 <b>Tổng kết ${m}/${y}</b>`,
    monthIncome: (k: string) =>
      `💵 Thu nhập: <b>+${k}k</b>`,
    monthExpense: (k: string) =>
      `💸 Chi tiêu: <b>-${k}k</b>`,
    monthBalance: (k: string, positive: boolean) =>
      `🏦 Còn lại: <b>${positive ? '+' : ''}${k}k</b>`,
    reminderTitle: '🔔 <b>Nhắc nhở cuối ngày</b>',
    reminderBody: (count: number) =>
      `Bạn còn <b>${count}</b> giao dịch chưa phân loại:\n`,
    reminderFooter: '\n📂 Hãy phân loại để thống kê chính xác nhé!',
    dailySummary: (k: string, count: number) =>
      `📈 Hôm nay bạn đã chi <b>${k}k</b>\n` +
      `🧾 ${count} giao dịch`,
    noNote: 'Không có ghi chú',
    selectCategory: '📂 Chọn danh mục:',
    bankIncome: (k: string, gateway: string, note: string, balance: string) =>
      `💵 <b>Thu nhập ngân hàng</b>\n\n` +
      `💰 Số tiền: <b>+${k}k</b>\n` +
      `🏦 Ngân hàng: ${gateway}\n` +
      `📝 Nội dung: ${note || 'Không có'}\n` +
      `💳 Số dư: ${balance}k`,
    bankExpense: (k: string, gateway: string, note: string) =>
      `💸 <b>Chi tiêu ngân hàng</b>\n\n` +
      `💰 Số tiền: <b>-${k}k</b>\n` +
      `🏦 Ngân hàng: ${gateway}\n` +
      `📝 Nội dung: ${note || 'Không có'}\n\n` +
      `📂 Chọn danh mục:`,
  },
} as const;
