/* Shared display constants for the AI Content Department UI.
   Pure data — safe to import from both server and client components. */

export const CATEGORY_ICONS: Record<string, string> = {
  news: "📰",
  useful: "💡",
  case: "📋",
  ai: "🤖",
  logistics: "🚚",
  marketplace: "🛒",
  supplier: "🏭",
  economics: "💹",
  sales: "📣",
};

export const CATEGORY_LABELS: Record<string, string> = {
  news: "Новости",
  useful: "Польза",
  case: "Кейс",
  ai: "AI",
  logistics: "Логистика",
  marketplace: "Маркетплейсы",
  supplier: "Поставщики",
  economics: "Экономика",
  sales: "Реклама",
};

export const PLATFORM_ICONS: Record<string, string> = {
  telegram: "✈️",
  vk: "💙",
  max: "🟠",
  all: "🌐",
};

export const PLATFORM_LABELS: Record<string, string> = {
  telegram: "Telegram",
  vk: "VK",
  max: "MAX",
  all: "Все",
};

export const STATUS_LABELS: Record<string, string> = {
  generated: "Новый",
  approved: "Одобрен",
  scheduled: "Запланирован",
  published: "Опубликован",
  rejected: "Отклонён",
};

export const STATUS_COLORS: Record<string, string> = {
  generated: "bg-slate-700 text-slate-200 border border-slate-600",
  approved: "bg-blue-900/50 text-blue-300 border border-blue-700/40",
  scheduled: "bg-green-900/40 text-green-300 border border-green-700/40",
  published: "bg-emerald-900/40 text-emerald-300 border border-emerald-700/40",
  rejected: "bg-red-900/30 text-red-400 border border-red-700/30",
};

export const AUDIENCE_LABELS: Record<string, string> = {
  wb_seller: "Продавцы WB",
  ozon_seller: "Продавцы Ozon",
  b2b: "B2B",
  beginner: "Новички",
  wholesaler: "Оптовики",
  all: "Все",
};

export function catIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? "📝";
}

export function catLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function platIcon(platform: string): string {
  return PLATFORM_ICONS[platform] ?? "📡";
}

export function platLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? STATUS_COLORS.generated;
}
