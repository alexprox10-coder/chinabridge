import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Платформа ChinaBridge — AI инструменты для импортёров из Китая",
  description:
    "AI-платформа для бизнеса с Китаем: калькулятор юнит-экономики, поиск поставщиков, расчёт доставки, автоматизация ВЭД. Для WB, Ozon, Kaspi и оптовых закупок.",
  alternates: { canonical: "https://chinabridge.pro/platform" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
