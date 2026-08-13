import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FulfilmentClient from "./FulfilmentClient";

export const metadata: Metadata = {
  title: "Фулфилмент для маркетплейсов из Китая — WB, Ozon, Kaspi | ChinaBridge",
  description:
    "Полная цепочка от фабрики в Китае до полки WB, Ozon и Kaspi. Упаковка, маркировка, Честный знак, доставка на склад маркетплейса. Склады в Москве и Алматы.",
  keywords: [
    "фулфилмент для маркетплейсов",
    "фулфилмент из Китая",
    "фулфилмент WB Ozon",
    "фулфилмент Казахстан Алматы",
    "маркировка товаров для WB",
    "упаковка для Wildberries",
    "Честный знак маркировка",
    "доставка из Китая на склад WB",
  ],
  alternates: { canonical: "https://chinabridge.pro/fulfilment" },
};

export default function FulfilmentPage() {
  return (
    <>
      <Header />
      <FulfilmentClient />
      <Footer />
    </>
  );
}
