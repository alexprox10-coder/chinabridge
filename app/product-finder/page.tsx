import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ProductFinderUI } from "@/components/product-finder/ProductFinderUI";

export const metadata: Metadata = {
  title: "AI Поиск товаров из Китая — ChinaBridge",
  description:
    "Опишите товар на русском — AI найдёт варианты с ценами, MOQ и прямыми ссылками на 1688 и Alibaba.",

  alternates: { canonical: "https://chinabridge.pro/product-finder" },
};

export default function ProductFinderPage() {
  return (
    <main>
      <Header />
      <div className="min-h-screen bg-[#060f1e] pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-3">
              AI Поиск товаров
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Найдите <span className="text-gradient">товар</span>
              <br />
              из Китая
            </h1>
            <p className="text-[#8899aa] text-lg">
              Опишите на русском — AI предложит варианты с ценами, MOQ и ссылками на поставщиков
            </p>
          </div>
          <ProductFinderUI />
        </div>
      </div>
      <Footer />
    </main>
  );
}
