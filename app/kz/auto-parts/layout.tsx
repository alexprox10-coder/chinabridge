import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Автозапчасти из Китая в Казахстан — доставка карго | ChinaBridge",
  description:
    "Доставка автозапчастей из Китая в Алматы, Астану, Шымкент. Оригинал и аналог для любых марок авто. Сборный карго от 30 кг. Расчёт стоимости за 15 минут.",
  alternates: { canonical: "https://chinabridge.pro/kz/auto-parts" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
