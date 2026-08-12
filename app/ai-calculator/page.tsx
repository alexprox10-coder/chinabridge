import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AIEconomicsFunnel from "@/components/ai-funnel/AIEconomicsFunnel";

export const metadata: Metadata = {
  title: "AI-Анализ товара из Китая — бесплатный расчёт юнит-экономики | ChinaBridge",
  description:
    "Вставьте ссылку на товар с 1688 или Alibaba — AI рассчитает себестоимость, таможню, маржу и прибыль. Без регистрации. Результат за 15 секунд.",
  openGraph: {
    title: "AI-Анализ товара из Китая — юнит-экономика за 15 секунд",
    description:
      "Рассчитайте прибыль от импорта: ссылка на товар → AI-анализ → маржа, ROI, таможня. Бесплатно, без регистрации.",
    type: "website",
  },
};

export default function AICalculatorPage() {
  return (
    <main>
      <Header />
      <div className="min-h-screen bg-[#060f1e] pt-24 pb-24">
        {/* Background glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-64 top-1/3 w-[700px] h-[700px] rounded-full bg-[#00A86B]/6 blur-[140px]" />
          <div className="absolute -right-40 bottom-1/4 w-[500px] h-[500px] rounded-full bg-[#00A86B]/4 blur-[120px]" />
        </div>

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
          {/* Page header */}
          <div className="text-center mb-10">
            <p className="text-[#00A86B] text-xs font-semibold uppercase tracking-widest mb-3">
              AI Unit Economics
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Рассчитайте прибыль<br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[#00A86B] to-[#00d48a] bg-clip-text text-transparent">
                {" "}от импорта из Китая
              </span>
            </h1>
            <p className="text-[#8899aa] text-sm leading-relaxed max-w-lg mx-auto">
              Вставьте ссылку на 1688 или Alibaba — AI проверит товар, рассчитает
              таможню, маржу и потенциальную прибыль. Бесплатно.
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-8 text-xs text-[#8899aa]">
            {[
              { icon: "🔒", text: "Без регистрации" },
              { icon: "⚡", text: "Результат за 15 сек" },
              { icon: "🤖", text: "AI-анализ GPT-4o" },
              { icon: "🚀", text: "Реальные данные" },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-1.5">
                <span>{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>

          {/* Funnel */}
          <AIEconomicsFunnel />

          {/* Social proof */}
          <div className="mt-10 text-center">
            <p className="text-xs text-[#8899aa] mb-4">Уже рассчитали более 500 товаров этой недели</p>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-[#8899aa]">
              <span>🛍️ Wildberries</span>
              <span>🟠 Ozon</span>
              <span>🇰🇿 Kaspi</span>
              <span>🟡 Яндекс Маркет</span>
              <span>📦 Оптовики</span>
            </div>
          </div>

          {/* Back to main calculator */}
          <div className="mt-8 text-center">
            <a
              href="/delivery-calculator"
              className="text-xs text-[#8899aa] hover:text-[#00A86B] transition-colors underline underline-offset-2"
            >
              Нужен детальный расчёт доставки? → Калькулятор доставки
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
