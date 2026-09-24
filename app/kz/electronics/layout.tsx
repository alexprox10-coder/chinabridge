import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Электроника из Китая в Казахстан — доставка карго | ChinaBridge",
  description:
    "Карго-доставка электроники из Китая в Алматы, Астану и Шымкент. Смартфоны, ноутбуки, бытовая техника. Сборный груз от 1 кг, авиа и авто. Расчёт за 15 минут.",
  alternates: { canonical: "https://chinabridge.pro/kz/electronics" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
