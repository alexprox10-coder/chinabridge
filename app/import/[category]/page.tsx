"use client";

import { useState, use, useTransition, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { trackGAEvent } from "@/lib/analytics/ga";
import { analytics } from "@/lib/analytics";
import { reachGoal } from "@/lib/analytics/metrika";

const CATEGORIES: Record<string, {
  title: string;
  subtitle: string;
  placeholder: string;
  emoji: string;
  items: string[];
  caseTitle: string;
  caseStats: Array<{ v: string; l: string }>;
  caseText: string;
  priceHint: string;
  source: string;
}> = {
  electronics: {
    title: "Электроника из Китая",
    subtitle: "Найдём производителя, проверим фабрику, привезём с документами в Россию или Казахстан. Поставщик уже есть — менять не нужно.",
    placeholder: "Наушники, смартфоны, зарядки, умные часы...",
    emoji: "📱",
    priceHint: "от $2.50/кг авто 5-8 дн · от $2.50/кг в КЗ · от $3/кг в РФ · авиа от $23/кг",
    items: ["Смартфоны и планшеты", "Аудио и аксессуары", "Зарядки и кабели", "Умный дом", "Игровые устройства", "Камеры и фото"],
    caseTitle: "500 наушников из Shenzhen → Москва",
    caseStats: [{ v: "5-8 дн.", l: "авто в КЗ" }, { v: "$2.50/кг", l: "авто ставка" }, { v: "38%", l: "маржа" }],
    caseText: "Клиент нашёл поставщика на 1688, мы проверили фабрику, выкупили партию, организовали консолидацию и доставку с полным пакетом документов.",
    source: "landing_import_electronics",
  },
  "auto-parts": {
    title: "Автозапчасти из Китая",
    subtitle: "Прямые поставки автозапчастей и автоаксессуаров с заводов Китая. Оригинал и совместимые детали. Поставщик есть — возьмём в работу.",
    placeholder: "Фильтры, тормозные колодки, бамперы, оптика...",
    emoji: "🚗",
    priceHint: "от $2.50/кг авто 5-8 дн · от $2.50/кг в КЗ · от $3/кг в РФ · авиа от $23/кг",
    items: ["Фильтры и расходники", "Тормозная система", "Кузовные детали", "Оптика и электрика", "Ходовая часть", "Аксессуары в салон"],
    caseTitle: "1000 тормозных колодок → Алматы",
    caseStats: [{ v: "22 дн.", l: "морем" }, { v: "$0.9/кг", l: "ставка" }, { v: "42%", l: "маржа" }],
    caseText: "Поставщик уже был, мы забрали товар с завода, прошли контроль качества, оформили сертификаты и доставили в Алматы.",
    source: "landing_import_auto_parts",
  },
  clothing: {
    title: "Одежда из Китая",
    subtitle: "Оптовые поставки одежды с фабрик Гуанчжоу, Чэнду и Иу. Сборные партии от 50 кг. Маркировка Честный Знак под ключ.",
    placeholder: "Куртки, футболки, платья, спортивная одежда...",
    emoji: "👕",
    priceHint: "от $2.50/кг авто 5-8 дн · от $2.50/кг в КЗ · от $3/кг в РФ · авиа от $23/кг",
    items: ["Верхняя одежда", "Повседневная одежда", "Спортивная одежда", "Детская одежда", "Нижнее бельё", "Аксессуары"],
    caseTitle: "300 курток из Гуанчжоу → WB",
    caseStats: [{ v: "25 дн.", l: "морем" }, { v: "$0.85/кг", l: "ставка" }, { v: "35%", l: "маржа" }],
    caseText: "Нашли фабрику по спецификации клиента, согласовали пошив, поставили Честный Знак, отгрузили на склад WB.",
    source: "landing_import_clothing",
  },
  furniture: {
    title: "Мебель из Китая",
    subtitle: "Прямые поставки мебели с производств Гуандун и Фошань. Сборка на складе, доставка в шоурум или дом.",
    placeholder: "Диваны, столы, стулья, шкафы, кровати...",
    emoji: "🛋️",
    priceHint: "авто от $2.50/кг 5-8 дн · FCL от $4250 · LCL от $150/м³ · сборный груз",
    items: ["Мягкая мебель", "Корпусная мебель", "Офисная мебель", "Кухни", "Спальня", "Уличная мебель"],
    caseTitle: "20 диванов из Фошань → Москва",
    caseStats: [{ v: "35 дн.", l: "морем FCL" }, { v: "$115/м³", l: "ставка" }, { v: "45%", l: "маржа" }],
    caseText: "Организовали выезд к производителю, согласовали материалы, упаковали и отгрузили контейнером с CMR и сертификатами.",
    source: "landing_import_furniture",
  },
  equipment: {
    title: "Оборудование из Китая",
    subtitle: "Промышленное и коммерческое оборудование с заводов Китая. Сертификация под РФ и КЗ. Шеф-монтаж по запросу.",
    placeholder: "Станки, компрессоры, насосы, генераторы...",
    emoji: "⚙️",
    priceHint: "авто от $2.50/кг 5-8 дн · FCL от $4250 · авиа от $23/кг · сборный груз",
    items: ["Производственное", "Строительное", "Пищевое", "Медицинское", "Упаковочное", "Энергетическое"],
    caseTitle: "3 компрессора из Шанхая → Екатеринбург",
    caseStats: [{ v: "28 дн.", l: "морем" }, { v: "$1.2/кг", l: "ставка" }, { v: "Сертифицировано", l: "ТР ЕАЭС" }],
    caseText: "Провели инспекцию на заводе, оформили декларацию соответствия ТР ЕАЭС, организовали доставку и помогли с шеф-монтажом.",
    source: "landing_import_equipment",
  },
  lighting: {
    title: "Светотехника из Китая",
    subtitle: "LED и декоративное освещение с фабрик Чжуншань. Сертификация, адаптация под 220В и ГОСТ.",
    placeholder: "LED-панели, прожекторы, люстры, лампы...",
    emoji: "💡",
    priceHint: "авто от $2.50/кг 5-8 дн · от $2.50/кг в КЗ · от $3/кг в РФ · авиа от $23/кг",
    items: ["Промышленное LED", "Уличное освещение", "Интерьерное", "Декоративное", "Умное освещение", "Специальное"],
    caseTitle: "5000 LED-панелей из Чжуншань → B2B",
    caseStats: [{ v: "20 дн.", l: "морем" }, { v: "$1.0/кг", l: "ставка" }, { v: "ГОСТ", l: "сертификат" }],
    caseText: "Нашли производителя с нужными параметрами, оформили декларацию соответствия, поставили на региональный склад.",
    source: "landing_import_lighting",
  },
  components: {
    title: "Электронные компоненты из Китая",
    subtitle: "Микросхемы, платы, модули и радиодетали с производств Шэньчжэня. Авиадоставка от 3 дней.",
    placeholder: "Микросхемы, модули, платы Arduino, сенсоры...",
    emoji: "🔩",
    priceHint: "авто от $2.50/кг 5-8 дн · авиа от $23/кг · авиаэкспресс от $33/кг · сборный груз",
    items: ["Микросхемы", "Платы и модули", "Сенсоры и датчики", "Разъёмы", "Резисторы и конденсаторы", "Дисплеи"],
    caseTitle: "Партия микросхем → Москва авиа",
    caseStats: [{ v: "4 дня", l: "авиа" }, { v: "$3.2/кг", l: "ставка" }, { v: "DDP", l: "условия" }],
    caseText: "Срочная поставка компонентов с завода в Шэньчжэне — DDP доставка авиаэкспрессом с таможенной очисткой.",
    source: "landing_import_components",
  },
};

const CITIES = ["Москва", "Санкт-Петербург", "Екатеринбург", "Новосибирск", "Краснодар", "Алматы", "Астана", "Другой город"];

export default function ImportCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const cfg = CATEGORIES[category];
  if (!cfg) notFound();

  const [done, setDone] = useState(false);
  const [telegram, setTelegram] = useState("");
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    analytics.landingView({ source: cfg.source });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notifyTgClick = (button: string) => {
    fetch("/api/tg-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: cfg.source, category, button }),
    }).catch(() => null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegram.trim()) return;
    setLoading(true);
    setTimeout(() => {
      trackGAEvent("import_lead_submit", { category, telegram });
      analytics.formSubmit({ form_id: `import_landing_${category}` });
      analytics.leadFormSubmit();
      reachGoal("form_submit");
      reachGoal("messenger_click");
    }, 0);
    try {
      await fetch("/api/landing-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram, product, has_supplier: "no", city: "", source: cfg.source }),
      });
    } catch { /* silent */ }
    startTransition(() => { setDone(true); setLoading(false); });
  };

  const TgIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.5l-2.95-.924c-.64-.203-.652-.64.135-.954l11.57-4.461c.537-.194 1.006.131.969.06z"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#060F1E] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#060F1E]/95 backdrop-blur border-b border-[#1a2d47]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-white font-bold text-lg tracking-tight">
            China<span className="text-[#00A86B]">Bridge</span>
          </Link>
          <a href="https://t.me/ChinaBridgeLID_bot" target="_blank" rel="noopener noreferrer"
            onClick={() => { trackGAEvent("import_header_tg_click", { category }); notifyTgClick("header"); }}
            className="flex items-center gap-1.5 text-sm bg-[#229ED9]/15 hover:bg-[#229ED9]/30 text-[#229ED9] px-3 py-1.5 rounded-lg transition-colors font-medium">
            <TgIcon />
            Написать менеджеру
          </a>
        </div>
      </header>

      {/* Sticky bottom CTA mobile */}
      {!done && (
        <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-[#060F1E]/97 backdrop-blur border-t border-[#1a2d47] px-4 py-3">
          <Link href="/ai-calculator"
            onClick={() => trackGAEvent("import_sticky_calc_click", { category })}
            className="flex items-center justify-center gap-2 w-full bg-[#00A86B] hover:bg-[#009060] text-white font-bold py-3.5 rounded-xl text-sm transition active:scale-95">
            🤖 Получить расчёт бесплатно
          </Link>
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 py-8 sm:py-14 pb-28 sm:pb-14">

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{cfg.emoji}</div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00A86B]/30 bg-[#00A86B]/10 text-[#00A86B] text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"/>
            Офис в Гуанчжоу · с 2019 года · 500+ клиентов
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">{cfg.title}</h1>
          <p className="text-[#8899aa] text-sm leading-relaxed">{cfg.subtitle}</p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          {cfg.caseStats.map(s => (
            <div key={s.l} className="bg-[#0B1F3A] border border-[#1a2d47] rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-[#00A86B]">{s.v}</div>
              <div className="text-xs text-[#8899aa]">{s.l}</div>
            </div>
          ))}
        </div>
        {cfg.priceHint && (
          <p className="text-center text-[#445566] text-xs mb-5">{cfg.priceHint}</p>
        )}

        {!done ? (
          <>
            {/* Primary CTA — Calculator */}
            <Link href="/ai-calculator"
              onClick={() => trackGAEvent("import_hero_calc_click", { category })}
              className="flex items-center justify-center gap-3 w-full bg-[#00A86B] hover:bg-[#009060] active:scale-[0.98] text-white font-bold py-4 rounded-2xl text-base transition mb-3 shadow-lg shadow-[#00A86B]/20">
              🤖 Получить расчёт бесплатно
            </Link>
            <p className="text-center text-[#445566] text-xs mb-6">Введите товар → AI рассчитает маржу за 10 секунд</p>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[#1a2d47]"/>
              <span className="text-[#445566] text-xs font-medium">нужна доставка — оставьте заявку</span>
              <div className="flex-1 h-px bg-[#1a2d47]"/>
            </div>

            {/* Secondary — 1-step form */}
            <form onSubmit={handleSubmit} className="bg-[#0B1F3A] border border-[#243a5e] rounded-2xl p-5 sm:p-6 mb-8">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-[#8899aa] mb-2 block font-medium uppercase tracking-wide">Ваш Telegram или телефон</label>
                  <input type="text" value={telegram} onChange={e => setTelegram(e.target.value)}
                    placeholder="@username или +7 999 000 00 00" required
                    className="w-full bg-[#060F1E] border border-[#243a5e] focus:border-[#00A86B]/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#445566] outline-none transition-colors"/>
                </div>
                <div>
                  <label className="text-xs text-[#8899aa] mb-2 block font-medium uppercase tracking-wide">Что хотите привезти? <span className="text-[#334466]">(необязательно)</span></label>
                  <input type="text" value={product} onChange={e => setProduct(e.target.value)}
                    placeholder={cfg.placeholder}
                    className="w-full bg-[#060F1E] border border-[#243a5e] focus:border-[#00A86B]/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#445566] outline-none transition-colors"/>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {cfg.items.slice(0, 3).map(item => (
                      <button key={item} type="button" onClick={() => setProduct(item)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-[#243a5e]/60 text-[#8899aa] hover:text-white hover:bg-[#243a5e] transition-colors">
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#00A86B] hover:bg-[#009060] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition active:scale-95">
                  {loading ? "Отправляем..." : "Отправить заявку →"}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Done */
          <div className="bg-[#0B1F3A] border border-[#00A86B]/40 rounded-2xl p-8 mb-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="font-bold text-xl mb-2">Заявка принята!</h2>
            <p className="text-[#8899aa] mb-6">Менеджер напишет в течение 15 минут с ценой и сроками.</p>
            <a href={`https://t.me/ChinaBridgeLID_bot?start=${encodeURIComponent(product || category)}`}
              target="_blank" rel="noopener noreferrer"
              onClick={() => notifyTgClick("done_cta")}
              className="inline-flex items-center gap-2 bg-[#229ED9] hover:bg-[#1a8dbf] text-white font-semibold px-6 py-3 rounded-xl transition">
              <TgIcon />
              Написать в Telegram сейчас
            </a>
          </div>
        )}

        {/* Case */}
        <div className="bg-gradient-to-br from-[#00A86B]/10 to-[#00A86B]/5 border border-[#00A86B]/30 rounded-2xl p-5 mb-6">
          <div className="text-xs text-[#00A86B] font-medium uppercase tracking-wide mb-2">Кейс</div>
          <h3 className="font-bold text-base mb-3">{cfg.caseTitle}</h3>
          <p className="text-[#8899aa] text-sm leading-relaxed">{cfg.caseText}</p>
        </div>

        {/* Trust points */}
        <div className="flex flex-col gap-3 mb-8">
          {[
            { icon: "🏭", title: "Поставщик уже есть?", desc: "Возьмём в работу — не нужно его менять." },
            { icon: "📦", title: "Небольшая партия?", desc: "Консолидация от 50 кг, сборные рейсы." },
            { icon: "📋", title: "Не хотите заниматься ВЭД?", desc: "ChinaBridge координирует всё под ключ." },
          ].map(t => (
            <div key={t.title} className="bg-[#0B1F3A] border border-[#1a2d47] rounded-xl p-4 flex gap-3 items-start">
              <div className="text-xl flex-shrink-0">{t.icon}</div>
              <div>
                <p className="font-semibold text-sm mb-0.5">{t.title}</p>
                <p className="text-[#8899aa] text-xs">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
