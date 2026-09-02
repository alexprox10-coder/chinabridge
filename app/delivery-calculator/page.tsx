import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { TelegramLeadCapture } from "@/components/leads/TelegramLeadCapture";

export const metadata: Metadata = {
  title: "Калькулятор доставки из Китая — ChinaBridge",
  description:
    "Рассчитайте предварительную стоимость и способ доставки товаров из Китая в Россию и Казахстан.",

  alternates: { canonical: "https://chinabridge.pro/delivery-calculator" },
};

export default function DeliveryCalculatorPage() {
  return (
    <main>
      <Header />
      <div className="min-h-screen bg-[#060f1e] pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Page header */}
          <div className="text-center mb-12">
            <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-3">
              Бесплатный расчёт
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Калькулятор <span className="text-gradient">доставки</span>
              <br />
              из Китая
            </h1>
            <p className="text-[#8899aa] text-lg">
              Укажите параметры груза — AI подберёт оптимальный способ доставки
            </p>
          </div>
          <CalculatorForm />
          <TelegramLeadCapture
            source="delivery-calculator"
            contextHint="расчёт доставки из Китая"
          />
        </div>
      </div>
      <Footer />
    </main>
  );
}
