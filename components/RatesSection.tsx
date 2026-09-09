import Link from "next/link";

const ROUTES = [
  {
    dest: "Казахстан",
    flag: "🇰🇿",
    href: "/delivery/china-kazakhstan",
    modes: [
      { icon: "🚗", label: "Авто (сборный)",   price: "от $2.50/кг", days: "5–8 дней",   note: "Алматы, Астана, Шымкент" },
      { icon: "🚂", label: "Ж/Д",              price: "от $3.50/кг", days: "12–15 дней",  note: "Алматы, крупный груз" },
      { icon: "✈️", label: "Авиа стандарт",   price: "от $23/кг",   days: "3–5 дней",   note: "от 1 кг" },
      { icon: "⚡", label: "Авиа экспресс",   price: "от $33/кг",   days: "1–2 дня",    note: "срочно, от 1 кг" },
    ],
  },
  {
    dest: "Россия",
    flag: "🇷🇺",
    href: "/delivery/china-moscow",
    modes: [
      { icon: "🚗", label: "Авто через КЗ",    price: "от $3.00/кг", days: "18–25 дней",  note: "Москва, СПб, регионы" },
      { icon: "🚗", label: "Авто ДВ транзит",  price: "от $3/кг",    days: "35–45 дней",  note: "через Владивосток" },
      { icon: "✈️", label: "Авиа стандарт",   price: "от $23/кг",   days: "5–8 дней",   note: "Шереметьево, Домодедово" },
      { icon: "⚡", label: "Авиа экспресс",   price: "от $33/кг",   days: "3 дня",      note: "от 1 кг, срочно" },
    ],
  },
];

export default function RatesSection() {
  return (
    <section className="bg-[#0B1F3A] py-14">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold tracking-widest text-[#00A86B] uppercase mb-3">
            Актуальные тарифы
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Стоимость и сроки доставки
          </h2>
          <p className="text-[#8899aa] text-sm mt-2">
            Партнёр 97Kapro · тарифы действуют с августа 2026 · мин. 30 кг авто
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {ROUTES.map((route) => (
            <div
              key={route.dest}
              className="bg-[#0f2644]/70 border border-[#243a5e] rounded-2xl overflow-hidden"
            >
              {/* Direction header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#243a5e]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{route.flag}</span>
                  <span className="text-white font-bold text-lg">
                    Китай → {route.dest}
                  </span>
                </div>
                <Link
                  href={route.href}
                  className="text-xs text-[#00A86B] hover:underline"
                >
                  Подробнее →
                </Link>
              </div>

              {/* Modes table */}
              <div className="divide-y divide-[#243a5e]/60">
                {route.modes.map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-base w-5 shrink-0">{m.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{m.label}</p>
                        <p className="text-xs text-[#8899aa] truncate">{m.note}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-bold text-[#00A86B]">{m.price}</p>
                      <p className="text-xs text-[#8899aa]">{m.days}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FCL / Container row */}
        <div className="mt-4 bg-[#0f2644]/50 border border-[#243a5e] rounded-2xl px-5 py-4 flex flex-wrap items-center gap-6 justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🚢</span>
            <div>
              <p className="text-white font-semibold text-sm">Контейнер FCL (море)</p>
              <p className="text-xs text-[#8899aa]">Полный контейнер под ключ, от 1 CBM LCL</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-sm font-bold text-[#00A86B]">от $4 250</p>
              <p className="text-xs text-[#8899aa]">20ft FCL · 35–50 дней</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-[#00A86B]">от $150/м³</p>
              <p className="text-xs text-[#8899aa]">LCL сборный · 35–50 дней</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/ai-calculator"
            className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            🤖 Рассчитать точную стоимость
          </Link>
          <a
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-[#243a5e] hover:border-[#00A86B]/40 text-[#8899aa] hover:text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Написать менеджеру
          </a>
        </div>
      </div>
    </section>
  );
}
