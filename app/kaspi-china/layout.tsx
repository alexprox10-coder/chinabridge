import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Товары из Китая для Kaspi.kz — доставка карго в Казахстан | ChinaBridge",
  description:
    "Доставка товаров из Китая для продавцов Kaspi.kz. Поиск поставщиков на 1688, расчёт маржи на Kaspi, карго в Алматы от 50 кг. Представитель в Китае на месте.",
  keywords: [
    "товары из китая для kaspi",
    "kaspi товары из китая оптом",
    "поставщик для kaspi китай",
    "карго китай казахстан kaspi",
    "импорт из китая для kaspi kz",
    "1688 товары для kaсpi",
  ],
  alternates: { canonical: "https://chinabridge.pro/kaspi-china" },
  openGraph: {
    title: "Товары из Китая для Kaspi.kz | ChinaBridge",
    description: "Поиск поставщиков на 1688, расчёт маржи Kaspi, карго в Алматы от 50 кг.",
    type: "website",
    url: "https://chinabridge.pro/kaspi-china",
    locale: "ru_RU",
    siteName: "ChinaBridge",
  },
  robots: { index: true, follow: true },
};

export default function KaspiChinaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
