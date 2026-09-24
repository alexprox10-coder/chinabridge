import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Белая растаможка из Китая — официальный импорт для WB и Ozon | ChinaBridge",
  description:
    "Официальный белый импорт товаров из Китая под ключ. Таможенное оформление через Суньфэньхэ, сертификация, маркировка для Wildberries и Ozon. Работаем с ИП и ООО.",
  alternates: { canonical: "https://chinabridge.pro/white-import" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
