import Header from "@/components/Header";
import Services from "@/components/Services";
import Calculator from "@/components/Calculator";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Услуги — ChinaBridge | Закупки из Китая",
  description: "Поиск поставщика, проверка фабрики, выкуп товара, сборные грузы и контроль качества. Прямые цены производителей.",
};

export default function ServicesPage() {
  return (
    <main>
      <Header />
      <div className="pt-20">
        <Services />
        <Calculator />
      </div>
      <Footer />
    </main>
  );
}
