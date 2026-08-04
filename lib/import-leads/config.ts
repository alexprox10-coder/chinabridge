import type { LeadScore } from "./types";

export interface ImportLeadsConfig {
  companyId: string;
  companyName: string;
  website: string;
  searchQueries: string[];
  categories: string[];
  regions: string[];
  telegramChatId: string;
  dailyLimit: number;
  minScore: LeadScore;
  messageTemplate: string;
}

export const DEFAULT_CONFIG: ImportLeadsConfig = {
  companyId: "chinabridge",
  companyName: "ChinaBridge",
  website: "https://chinabridge.pro",
  searchQueries: [
    "производитель мебели",
    "интернет магазин оптовая",
    "бренд одежды производство",
    "Wildberries продавец поставщик",
    "Ozon продавец товары",
    "маркетплейс поставщик оптом",
    "производство товаров для дома",
    "оптовая компания электроника",
    "производитель автозапчасти",
    "упаковка производство оптом",
  ],
  categories: [
    "мебель",
    "электроника",
    "одежда",
    "автозапчасти",
    "товары для дома",
    "оборудование",
    "упаковка",
    "игрушки",
    "косметика",
    "спорттовары",
  ],
  regions: ["Москва", "Санкт-Петербург", "Казань", "Новосибирск", "Россия"],
  telegramChatId: process.env.TELEGRAM_IMPORT_LEADS_CHAT ?? process.env.TELEGRAM_CHAT_ID ?? "",
  dailyLimit: 30,
  minScore: 3,
  messageTemplate: `Здравствуйте!

Посмотрели вашу компанию {{company}} — вы работаете в категории {{category}}.

Мы помогаем бизнесу находить проверенных производителей в Китае, организовывать белый импорт и рассчитывать полную себестоимость поставки.

Если интересно — можем бесплатно сделать расчёт вашего товара.

{{website}}`,
};

export function getConfig(overrides?: Partial<ImportLeadsConfig>): ImportLeadsConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

export function applyMessageTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return Object.entries(vars).reduce(
    (msg, [key, val]) => msg.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val),
    template
  );
}
