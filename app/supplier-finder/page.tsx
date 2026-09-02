import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SupplierFinderUI } from "@/components/supplier-finder/SupplierFinderUI";

export const metadata: Metadata = {
  title: "AI Поиск поставщиков из Китая — ChinaBridge",
  description:
    "AI анализирует рынок поставщиков в Китае: типы, регионы, цены, MOQ и Supplier Score для вашего товара.",

  alternates: { canonical: "https://chinabridge.pro/supplier-finder" },
};

export default function SupplierFinderPage() {
  return (
    <main>
      <Header />
      <div className="min-h-screen bg-[#060f1e] pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-3">
              AI Поиск поставщиков
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Найдите <span className="text-gradient">поставщика</span>
              <br />
              в Китае
            </h1>
            <p className="text-[#8899aa] text-lg">
              AI анализирует рынок: типы поставщиков, Supplier Score, риски и рекомендации
            </p>
          </div>
          <SupplierFinderUI />
        </div>
      </div>
      <Footer />
    </main>
  );
}
