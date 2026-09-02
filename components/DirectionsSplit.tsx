"use client";

import { useState } from "react";
import { ArrowRight, ShoppingBag, TrendingUp } from "lucide-react";
import Link from "next/link";
import { trackGAEvent } from "@/lib/analytics/ga";

export default function DirectionsSplit() {
  const [urlA, setUrlA] = useState("");

  return (
    <section className="relative py-16 md:py-20 bg-[#040d1a] overflow-hidden" id="directions-split">
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-3">AI-калькулятор импорта</p>
          <h2 className="text-3xl md:text-4xl font-bold">
            Рассчитайте прибыль <span className="text-gradient">до закупки</span>
          </h2>
          <p className="text-[#8899aa] mt-3 max-w-xl mx-auto">
            AI считает маржу, логистику и таможню для WB, Ozon и Kaspi — прежде чем вы потратите деньги
          </p>
        </div>

        <div>

          {/* ── КАРТОЧКА: Import AI (для селлеров) ── */}
          <div className="group relative rounded-3xl border border-[#243a5e] bg-gradient-to-br from-[#0B1F3A] to-[#071628] p-8 hover:border-[#00A86B]/40 transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,168,107,0.08)]">
            {/* Метка */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00A86B]/10 border border-[#00A86B]/20 text-[#00A86B] text-xs font-semibold mb-6">
              <ShoppingBag className="w-3.5 h-3.5" />
              Import AI — для селлеров
            </div>

            <h3 className="text-2xl font-bold mb-3">
              Хочу продавать<br/>на WB, Ozon, Kaspi
            </h3>
            <p className="text-[#8899aa] text-sm leading-relaxed mb-6">
              Находим товар на 1688, считаем маржу с учётом логистики и таможни, доставляем под ключ на склад маркетплейса.
            </p>

            {/* Чипы преимуществ */}
            <ul className="flex flex-wrap gap-2 mb-7">
              {["AI-поиск товара на 1688", "Расчёт маржи до закупки", "Доставка Китай → РФ / KZ / BY / AM / UZ", "Фулфилмент Москва / Алматы"].map(t => (
                <li key={t} className="px-3 py-1 rounded-full bg-[#00A86B]/8 border border-[#00A86B]/15 text-[#8899aa] text-xs">{t}</li>
              ))}
            </ul>

            {/* Lead magnet: URL 1688 → калькулятор */}
            <div className="bg-[#0a1c35] border border-[#243a5e] rounded-2xl p-4 mb-5">
              <p className="text-xs text-[#8899aa] mb-2 font-medium">🔗 Вставьте ссылку с 1688 или Alibaba — AI рассчитает прибыль:</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlA}
                  onChange={e => setUrlA(e.target.value)}
                  placeholder="https://detail.1688.com/..."
                  className="flex-1 bg-[#0B1F3A] border border-[#243a5e] rounded-xl px-3 py-2 text-sm text-white placeholder-[#4a6080] focus:outline-none focus:border-[#00A86B]/50 transition-colors"
                />
                <Link
                  href={urlA ? `/ai-calculator?url=${encodeURIComponent(urlA)}` : "/ai-calculator"}
                  onClick={() => trackGAEvent("split_import_calc_click")}
                  className="px-4 py-2 bg-[#00A86B] hover:bg-[#008f59] text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5"
                >
                  Считать <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="/ai-calculator"
                onClick={() => trackGAEvent("split_import_main_click")}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#00A86B] hover:bg-[#008f59] text-white text-sm font-semibold rounded-xl transition-all"
              >
                <TrendingUp className="w-4 h-4" /> Рассчитать прибыль
              </Link>
              <Link
                href="/fulfilment"
                onClick={() => trackGAEvent("split_import_fulfilment_click")}
                className="px-4 py-3 border border-[#243a5e] hover:border-[#00A86B]/40 text-[#8899aa] hover:text-white text-sm rounded-xl transition-all"
              >
                Фулфилмент
              </Link>
            </div>
          </div>

        </div>

        {/* Нижняя плашка — доверие */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#8899aa]">
          {["Работаем с 2019 года", "РФ · KZ · BY · AM · UZ", "ГТД и документы под ключ", "AI на каждом этапе"].map(t => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#00A86B]" />{t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
