"use client";

import { useEffect, useRef } from "react";

const COMPARISON_ROWS = [
  {
    param: "ГТД с номером",
    cb: { val: "Включена", ok: true },
    stack: { val: "Нет", ok: false },
  },
  {
    param: "Сертификаты качества",
    cb: { val: "По запросу", ok: true },
    stack: { val: "Сами договаривайтесь", ok: false },
  },
  {
    param: "Оплата поставщику в ¥",
    cb: { val: "Прямой канал", ok: true },
    stack: { val: "Риски SWIFT", ok: false },
  },
  {
    param: "Выкуп + доставка + таможня",
    cb: { val: "Один договор", ok: true },
    stack: { val: "3 подрядчика", ok: false },
  },
  {
    param: "Представитель в Китае",
    cb: { val: "Есть, выезжает", ok: true },
    stack: { val: "Нет", ok: false },
  },
  {
    param: "Стоимость ошибки",
    cb: { val: "Страхуем груз", ok: true },
    stack: { val: "Ваш риск", ok: false },
  },
];

export default function GtdCompareBlock() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    ref.current?.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {/* ── 1. GTD-only block ──────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-[#060f1e]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="fade-up text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00A86B]/30 bg-[#00A86B]/10 text-[#00A86B] text-xs font-medium mb-4 uppercase tracking-widest">
              Официальное оформление
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ГТД при каждой&nbsp;
              <span className="text-gradient">официальной поставке</span>
            </h2>
            <p className="text-[#8899aa] max-w-2xl mx-auto text-base leading-relaxed">
              Грузовая таможенная декларация с номером — документ, подтверждающий законность ввоза товара.
              Мы работаем только через официальные таможенные пункты и выдаём ГТД при каждой белой поставке.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🔒",
                title: "Подтверждение законности ввоза",
                desc: "ГТД подтверждает официальный ввоз товара через таможню и используется при листинге на WB и Ozon для подтверждения происхождения.",
              },
              {
                icon: "📋",
                title: "Номер ГТД в листинге",
                desc: "Формат 10702020/ДДММГГ/XXXXXXX — выдаём при каждой поставке через Суньфэньхэ (официальный КПП).",
              },
              {
                icon: "📄",
                title: "Полный пакет документов",
                desc: "Сертификаты качества и тех. паспорта прилагаются по запросу. Один пакет закрывает все требования площадок.",
              },
            ].map((card) => (
              <div key={card.title} className="fade-up card-glass rounded-2xl p-6 border border-[#00A86B]/20">
                <div className="text-3xl mb-4">{card.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{card.title}</h3>
                <p className="text-[#8899aa] text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Comparison table ────────────────────────────────────────── */}
      <section className="py-20 bg-[#0B1F3A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="fade-up text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[#8899aa] text-xs font-medium mb-4 uppercase tracking-widest">
              Сравнение
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              ChinaBridge&nbsp;
              <span className="text-gradient">vs «сделать самому»</span>
            </h2>
            <p className="text-[#8899aa] text-base max-w-xl mx-auto">
              WeChat-байер + карго-компания + таможенный брокер — на каждом этапе свой подрядчик, своя ответственность, свой ценник
            </p>
          </div>

          <div className="fade-up overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-[#8899aa] font-medium w-1/2"></th>
                  <th className="px-4 py-3 text-center">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span className="text-white font-bold text-base">ChinaBridge</span>
                      <span className="text-[10px] text-[#00A86B] bg-[#00A86B]/15 px-2 py-0.5 rounded-full">Всё включено</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span className="text-[#8899aa] font-bold text-base">«Сделать самому»</span>
                      <span className="text-[10px] text-[#8899aa] bg-white/5 px-2 py-0.5 rounded-full">байер + карго + брокер</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={row.param} className={i % 2 === 0 ? "bg-white/[0.03]" : ""}>
                    <td className="px-4 py-3.5 text-[#8899aa] border-t border-white/5">{row.param}</td>
                    <td className="px-4 py-3.5 text-center border-t border-white/5">
                      <span className={`inline-flex items-center gap-1.5 ${row.cb.ok ? "text-[#00A86B]" : "text-red-400"}`}>
                        <span>{row.cb.ok ? "✓" : "✗"}</span>
                        <span className="text-xs font-medium">{row.cb.val}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center border-t border-white/5">
                      <span className={`inline-flex items-center gap-1.5 ${row.stack.ok ? "text-[#00A86B]" : "text-red-400"}`}>
                        <span>{row.stack.ok ? "✓" : "✗"}</span>
                        <span className="text-xs font-medium">{row.stack.val}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="fade-up mt-8 text-center">
            <a
              href="https://t.me/ChinaBridgeLID_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all text-sm"
            >
              Получить расчёт под ключ →
            </a>
          </div>
        </div>
      </section>

      {/* ── 3. Yuan payment block ──────────────────────────────────────── */}
      <section className="py-20 bg-[#060f1e]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="fade-up grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00A86B]/30 bg-[#00A86B]/10 text-[#00A86B] text-xs font-medium mb-5 uppercase tracking-widest">
                Оплата поставщику
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                Оплата в юанях —<br />
                <span className="text-gradient">больше не проблема</span>
              </h2>
              <p className="text-[#8899aa] text-base leading-relaxed mb-6">
                В 2026 году перевод юаней в Китай — одна из главных болей при импорте.
                SWIFT заблокирован, большинство банков отказывают в CNY-платежах.
                ChinaBridge работает через проверенные прямые каналы — оплачиваем поставщику от вашего имени.
              </p>
              <ul className="space-y-3">
                {[
                  "Работаем напрямую с китайскими банками",
                  "Принимаем оплату в рублях и тенге — переводим в ¥",
                  "Полная прозрачность курса и комиссий",
                  "Юридически оформленный договор выкупа",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#8899aa]">
                    <span className="text-[#00A86B] mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              {[
                { label: "Вы платите", val: "В рублях или тенге", icon: "💳" },
                { label: "Мы конвертируем", val: "По прозрачному курсу CNY", icon: "🔄" },
                { label: "Поставщик получает", val: "Юани на китайский счёт", icon: "¥" },
                { label: "Вы получаете", val: "Товар + все документы", icon: "📦" },
              ].map((step, i) => (
                <div key={step.label} className="card-glass rounded-xl px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#00A86B]/15 border border-[#00A86B]/30 flex items-center justify-center text-lg flex-shrink-0">
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-[#8899aa] uppercase tracking-widest mb-0.5">{step.label}</p>
                    <p className="text-white text-sm font-semibold">{step.val}</p>
                  </div>
                  {i < 3 && (
                    <div className="text-[#00A86B] text-xs opacity-60">↓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
