import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Автоаксессуары из Китая в Казахстан — карго доставка | ChinaBridge",
  description:
    "Доставка автоаксессуаров из Китая в Казахстан. Чехлы, коврики, накидки, тюнинг. Сборный карго от 30 кг. Алматы, Астана, Шымкент. Получите расчёт за 15 минут.",
  alternates: { canonical: "https://chinabridge.pro/kz/auto-accessories" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
