import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Менеджер по импорту из Китая — бесплатный расчёт | ChinaBridge",
  description: "Рассчитайте полную стоимость поставки из Китая бесплатно. AI посчитает закупку, логистику, таможню, маржу на WB, Ozon, Kaspi. Укажите товар — получите готовый расчёт за 2 минуты.",
  keywords: [
    "расчёт поставки из Китая",
    "AI импорт из Китая",
    "стоимость доставки из Китая",
    "расчёт таможни Китай",
    "импорт калькулятор онлайн",
    "закупка в Китае расчёт",
    "расчёт маржи Wildberries Китай",
    "карго из Китая калькулятор",
  ],
  alternates: { canonical: "https://chinabridge.pro/ai" },
  openGraph: {
    title: "AI Менеджер по импорту из Китая | ChinaBridge",
    description: "Бесплатный AI-расчёт поставки: закупка + логистика + таможня + маржа на WB/Ozon/Kaspi. Результат за 2 минуты.",
    url: "https://chinabridge.pro/ai",
    type: "website",
    locale: "ru_RU",
    siteName: "ChinaBridge",
  },
};

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
