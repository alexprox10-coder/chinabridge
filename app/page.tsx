import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Advantages from "@/components/Advantages";
import ImportEcosystemBlock from "@/components/ImportEcosystemBlock";
import Process from "@/components/Process";
import Services from "@/components/Services";
import Directions from "@/components/Directions";
import Cases from "@/components/Cases";
import TrustBlock from "@/components/TrustBlock";
import Calculator from "@/components/Calculator";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Доставка из Китая под ключ | ChinaBridge — Импорт без серых схем",
  description:
    "ChinaBridge — официальный импорт из Китая в Россию и Казахстан. Поиск поставщика, проверка товара, сертификация, логистика, таможенное оформление. Белый импорт от 11 000 ₽.",
  keywords: [
    "импорт из Китая",
    "белый импорт из Китая",
    "белый импорт Китай",
    "импорт из Китая под ключ",
    "таможенное оформление Китай",
    "сертификация товара из Китая",
    "доставка Китай Россия",
    "доставка Китай Казахстан",
    "оплата поставщикам в Китае",
    "валютные платежи Китай",
    "проверка товара перед закупкой",
    "карго из Китая",
    "доставка сборных грузов",
    "поиск поставщика в Китае",
  ],
};

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <Advantages />
      <ImportEcosystemBlock />
      <Process />
      <Services />
      <Directions />
      <Cases />
      <TrustBlock />
      <Calculator />
      <FAQ />
      <Footer />
    </main>
  );
}
