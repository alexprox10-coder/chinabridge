"use client";

import { useState, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { trackGAEvent } from "@/lib/analytics/ga";

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
    priceHint: "от $1.1/кг морем · от $2.5/кг авиа",
    items: ["Смартфоны и планшеты", "Аудио и аксессуары", "Зарядки и кабели", "Умный дом", "Игровые устройства", "Камеры и фото"],
    caseTitle: "500 наушников из Shenzhen → Москва",
    caseStats: [{ v: "18 дн.", l: "морем" }, { v: "$1.1/кг", l: "ставка" }, { v: "38%", l: "маржа" }],
    caseText: "Клиент нашёл поставщика на 1688, мы проверили фабрику, выкупили партию, организовали консолидацию и доставку с полным пакетом документов.",
    source: "landing_import_electronics",
  },
  "auto-parts": {
    title: "Автозапчасти из Китая",
    subtitle: "Прямые поставки автозапчастей и автоаксессуаров с заводов Китая. Оригинал и совместимые детали. Поставщик есть — возьмём в работу.",
    placeholder: "Фильтры, тормозные колодки, бамперы, оптика...",
    emoji: "🚗",
    priceHint: "от $0.9/кг морем · от $2.2/кг авиа",
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
    priceHint: "от $0.85/кг морем · от $2.3/кг авиа",
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
    priceHint: "от $110/м³ морем · от $180/м³ FCL",
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
    priceHint: "от $1.2/кг морем · FCL от $850",
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
    priceHint: "от $1.0/кг морем · от $2.4/кг авиа",
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
    priceHint: "авиа от $3/кг · авиаэкспресс от $5/кг",
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

  const [step, setStep] = useState<"form" | "contact" | "done">("form");
  const [product, setProduct] = useState("");
  const [hasSupplier, setHasSupplier] = useState<"yes" | "no" | "">("");
  const [city, setCity] = useState("");
  const [telegram, setTelegram] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.trim()) return;
    trackGAEvent("import_form_step1", { category, product, has_supplier: hasSupplier, city });
    setStep("contact");
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegram.trim()) return;
    setLoading(true);
    trackGAEvent("import_lead_submit", { category, telegram });
    try {
      await fetch("/api/landing-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram, product, has_supplier: hasSupplier, city, source: cfg.source }),
      });
    } catch { /* silent */ }
    setStep("done");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#060F1E] text-white">
      {/* Minimal header */}
      <header className="sticky top-0 z-50 bg-[#060F1E]/95 backdrop-blur border-b border-[#1a2d47]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-white font-bold text-lg tracking-tight">
            China<span className="text-[#00A86B]">Bridge</span>
          </Link>
          <a href="https://t.me/ChinaBridgeLID_bot" target="_blank" rel="noopener noreferrer"
            className="text-sm text-[#00A86B] hover:text-white transition-colors">
            Telegram
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12 sm:py-20">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">{cfg.emoji}</div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00A86B]/30 bg-[#00A86B]/10 text-[#00A86B] text-xs font-medium mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"/>
            🇨🇳 Прямые поставки · Офис в Гуанчжоу · с 2019 года
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">{cfg.title}</h1>
          <p className="text-[#8899aa] text-base leading-relaxed">{cfg.subtitle}</p>
          <p className="text-[#445566] text-xs mt-3">{cfg.priceHint}</p>
        </div>

        {/* Qualifier form */}
        {step === "form" && (
          <form onSubmit={handleFormSubmit} className="bg-[#0B1F3A] border border-[#243a5e] rounded-2xl p-6 sm:p-8 mb-10">
            <h2 className="font-semibold text-lg mb-6">Расскажите о вашем товаре</h2>
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs text-[#8899aa] mb-2 block font-medium uppercase tracking-wide">Что хотите привезти?</label>
                <input
                  type="text"
                  value={product}
                  onChange={e => setProduct(e.target.value)}
                  placeholder={cfg.placeholder}
                  required
                  className="w-full bg-[#060F1E] border border-[#243a5e] focus:border-[#00A86B]/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#445566] outline-none transition-colors"
                />
                {/* Category chips */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {cfg.items.slice(0, 4).map(item => (
                    <button key={item} type="button"
                      onClick={() => setProduct(item)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-[#243a5e]/60 text-[#8899aa] hover:text-white hover:bg-[#243a5e] transition-colors">
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-[#8899aa] mb-2 block font-medium uppercase tracking-wide">Поставщик в Китае уже есть?</label>
                <div className="flex gap-3">
                  {(["yes", "no"] as const).map(v => (
                    <button key={v} type="button" onClick={() => setHasSupplier(v)}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border ${
                        hasSupplier === v
                          ? "bg-[#00A86B]/20 border-[#00A86B] text-[#00A86B]"
                          : "border-[#243a5e] text-[#8899aa] hover:border-[#00A86B]/40 hover:text-white"
                      }`}>
                      {v === "yes" ? "Да, есть" : "Нет, нужен"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-[#8899aa] mb-2 block font-medium uppercase tracking-wide">Куда доставить?</label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-[#060F1E] border border-[#243a5e] focus:border-[#00A86B]/60 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors appearance-none">
                  <option value="">Выберите город</option>
                  <optgroup label="Россия">
                    {CITIES.slice(0, 5).map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="Другой город РФ">Другой город РФ</option>
                  </optgroup>
                  <optgroup label="Казахстан">
                    <option value="Алматы">Алматы</option>
                    <option value="Астана">Астана</option>
                    <option value="Другой город КЗ">Другой город КЗ</option>
                  </optgroup>
                </select>
              </div>

              <button type="submit"
                className="w-full bg-[#00A86B] hover:bg-[#009060] text-white font-semibold py-3.5 rounded-xl transition active:scale-95">
                Получить расчёт →
              </button>
              <p className="text-center text-[#445566] text-xs">Без обязательств · Ответим за 15 минут</p>
            </div>
          </form>
        )}

        {/* Contact step */}
        {step === "contact" && (
          <form onSubmit={handleContactSubmit} className="bg-[#0B1F3A] border border-[#243a5e] rounded-2xl p-6 sm:p-8 mb-10">
            <div className="mb-6">
              <div className="text-xs text-[#00A86B] font-medium mb-1">Почти готово!</div>
              <h2 className="font-semibold text-lg">Куда отправить расчёт?</h2>
              <p className="text-[#8899aa] text-sm mt-1">Менеджер напишет напрямую с ценой и сроками</p>
            </div>
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs text-[#8899aa] mb-2 block font-medium uppercase tracking-wide">Ваш Telegram</label>
                <input type="text" value={telegram} onChange={e => setTelegram(e.target.value)}
                  placeholder="@username или номер телефона" required
                  className="w-full bg-[#060F1E] border border-[#243a5e] focus:border-[#00A86B]/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#445566] outline-none transition-colors"/>
              </div>
              <div className="bg-[#060F1E] rounded-xl p-4 text-sm text-[#8899aa] space-y-1">
                <div><span className="text-white font-medium">Товар:</span> {product}</div>
                {hasSupplier && <div><span className="text-white font-medium">Поставщик:</span> {hasSupplier === "yes" ? "Есть" : "Нужен"}</div>}
                {city && <div><span className="text-white font-medium">Город:</span> {city}</div>}
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#00A86B] hover:bg-[#009060] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition active:scale-95">
                {loading ? "Отправляем..." : "Получить расчёт бесплатно →"}
              </button>
              <button type="button" onClick={() => setStep("form")}
                className="text-center text-[#445566] text-xs hover:text-white transition-colors">
                ← Изменить данные
              </button>
            </div>
          </form>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="bg-[#0B1F3A] border border-[#00A86B]/40 rounded-2xl p-8 mb-10 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="font-bold text-xl mb-2">Заявка принята!</h2>
            <p className="text-[#8899aa] mb-6">Менеджер напишет в Telegram в течение 15 минут с ценой и сроками.</p>
            <a href={`https://t.me/ChinaBridgeLID_bot?start=${encodeURIComponent(product || category)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-block bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition">
              Написать в Telegram сейчас
            </a>
          </div>
        )}

        {/* Also try calculator */}
        <div className="bg-[#0B1F3A] border border-[#243a5e] rounded-2xl p-5 mb-8 flex items-start gap-4">
          <div className="text-2xl">🤖</div>
          <div className="flex-1">
            <p className="font-semibold text-sm mb-1">Хотите сначала проверить юнит-экономику?</p>
            <p className="text-[#8899aa] text-xs mb-3">AI-калькулятор за 15 сек рассчитает маржу на WB, Ozon и Kaspi</p>
            <Link href="/ai-calculator"
              onClick={() => trackGAEvent("import_to_calculator_click", { category })}
              className="inline-block text-xs text-[#00A86B] hover:text-white transition-colors font-medium">
              Открыть AI-калькулятор →
            </Link>
          </div>
        </div>

        {/* Case */}
        <div className="bg-gradient-to-br from-[#00A86B]/10 to-[#00A86B]/5 border border-[#00A86B]/30 rounded-2xl p-6 mb-8">
          <div className="text-xs text-[#00A86B] font-medium uppercase tracking-wide mb-3">Кейс</div>
          <h3 className="font-bold text-lg mb-3">{cfg.caseTitle}</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {cfg.caseStats.map(s => (
              <div key={s.l} className="text-center">
                <div className="text-xl font-bold text-[#00A86B]">{s.v}</div>
                <div className="text-xs text-[#8899aa]">{s.l}</div>
              </div>
            ))}
          </div>
          <p className="text-[#8899aa] text-sm leading-relaxed">{cfg.caseText}</p>
        </div>

        {/* Why us */}
        <div className="mb-8">
          <h2 className="font-bold text-lg mb-4">Почему нам</h2>
          <div className="flex flex-col gap-3">
            {[
              { icon: "🏭", title: "Поставщик уже есть?", desc: "Не нужно его менять. Возьмём в работу и организуем забор с его склада." },
              { icon: "📦", title: "Небольшая партия?", desc: "Рассмотрим консолидацию, если подходит по условиям. От 50 кг." },
              { icon: "📋", title: "Не хотите заниматься ВЭД?", desc: "ChinaBridge координирует поставку и необходимых участников процесса." },
            ].map(t => (
              <div key={t.title} className="bg-[#0B1F3A] border border-[#1a2d47] rounded-xl p-4 flex gap-4">
                <div className="text-2xl flex-shrink-0">{t.icon}</div>
                <div>
                  <p className="font-semibold text-sm mb-0.5">{t.title}</p>
                  <p className="text-[#8899aa] text-xs leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <a href="https://t.me/ChinaBridgeLID_bot" target="_blank" rel="noopener noreferrer"
            onClick={() => trackGAEvent("import_final_cta", { category })}
            className="inline-flex items-center gap-2 bg-[#229ED9] hover:bg-[#1a8dbf] text-white font-semibold px-6 py-3 rounded-xl transition">
            Написать в Telegram
          </a>
          <p className="text-[#445566] text-xs mt-3">или <Link href="/" className="hover:text-white underline">вернуться на главную</Link></p>
        </div>
      </main>
    </div>
  );
}
