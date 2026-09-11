"use client";

import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { analytics } from "@/lib/analytics";

const TgIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.5l-2.95-.924c-.64-.203-.652-.64.135-.954l11.57-4.461c.537-.194 1.006.131.969.06z" />
  </svg>
);

export default function KzAutoPartsPage() {
  useEffect(() => {
    analytics.landingView({ source: "kz_auto_parts" });
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#050e1d] text-white">
        <div className="max-w-lg mx-auto px-4 py-10 pb-20">

          {/* Hero */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🔧</div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00A86B]/30 bg-[#00A86B]/10 text-[#00A86B] text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
              Офис в Гуанчжоу · с 2019 года · 500+ клиентов
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
              Нужна запчасть из Китая?
            </h1>
            <p className="text-[#8899aa] text-sm leading-relaxed max-w-md mx-auto">
              Найдём поставщика, проверим и организуем доставку в Казахстан.<br />
              Представитель в Гуанчжоу — работаем напрямую с заводами.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { v: "29%", l: "импорта КЗ из Китая" },
              { v: "5–8 дней", l: "авто-доставка" },
              { v: "$2.50/кг", l: "тариф карго" },
            ].map(s => (
              <div key={s.l} className="bg-[#0B1F3A] border border-[#1a3a5c] rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-[#00A86B]">{s.v}</div>
                <div className="text-xs text-[#8899aa]">{s.l}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-[#445566] text-xs mb-7">
            авто 5–8 дн · авиа от $23/кг · от 1 штуки
          </p>

          {/* Primary CTA */}
          <Link
            href="/ai-calculator?country=KZ"
            onClick={() => analytics.calculatorStart()}
            className="flex items-center justify-center gap-3 w-full bg-[#00A86B] hover:bg-[#009060] active:scale-[0.98] text-white font-bold py-4 rounded-2xl text-base transition mb-3 shadow-lg shadow-[#00A86B]/20"
          >
            🤖 Узнать стоимость бесплатно
          </Link>
          <p className="text-center text-[#445566] text-xs mb-5">
            Укажите запчасть / модель авто → рассчитаем за 15 минут
          </p>

          {/* Secondary CTA */}
          <a
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => analytics.telegramClick()}
            className="flex items-center justify-center gap-2 w-full border border-[#1a3a5c] hover:border-[#00A86B]/40 text-[#8899aa] hover:text-white font-medium py-3.5 rounded-xl transition text-sm mb-8"
          >
            <TgIcon />
            Написать AI-консультанту в Telegram
          </a>

          {/* Case */}
          <div className="bg-gradient-to-br from-[#00A86B]/10 to-[#00A86B]/5 border border-[#00A86B]/30 rounded-2xl p-5 mb-6">
            <div className="text-xs text-[#00A86B] font-medium uppercase tracking-wide mb-2">Кейс</div>
            <h3 className="font-bold text-base mb-3">1 000 тормозных колодок из Китая → Алматы</h3>
            <p className="text-[#8899aa] text-sm leading-relaxed">
              Клиент продаёт на Kaspi. Нашли завод по артикулу, проверили партию, доставили за 7 дней. Себестоимость ×2.5 ниже аналогов на рынке.
            </p>
          </div>

          {/* Trust */}
          <div className="flex flex-col gap-3">
            {[
              { icon: "🏭", title: "Представитель в Китае", desc: "Проверяем поставщиков лично перед отправкой." },
              { icon: "📦", title: "От 1 штуки", desc: "Работаем с частными и бизнес-заказами." },
              { icon: "🚚", title: "Доставка в Алматы", desc: "Авто 5–8 дней, авиа 3–5 дней." },
            ].map(t => (
              <div key={t.title} className="bg-[#0B1F3A] border border-[#1a3a5c] rounded-xl p-4 flex gap-3 items-start">
                <div className="text-xl flex-shrink-0">{t.icon}</div>
                <div>
                  <p className="font-semibold text-sm mb-0.5">{t.title}</p>
                  <p className="text-[#8899aa] text-xs">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link href="/import-china-kazakhstan" className="text-[#00A86B] text-sm hover:underline">
              Узнать больше о доставке из Китая в Казахстан →
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
