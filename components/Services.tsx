"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Search, Eye, ShoppingCart, Package, ClipboardCheck, Star } from "lucide-react";
import { analytics } from "@/lib/analytics";

const services = [
  {
    icon: Search,
    title: "Аудит поставщика",
    desc: "Находим и проверяем производителей под ваш товар.",
    items: ["3–5 фабрик на 1688 / Alibaba", "Переговоры и лучшая цена", "Сравнительная таблица цен", "Проверка юридического статуса"],
    price: "от 15 000 ₽",
    hot: false,
    track: "sourcing",
  },
  {
    icon: Eye,
    title: "Инспекция фабрики",
    desc: "Физический выезд представителя на производство в Китае.",
    items: ["Выезд на фабрику лично", "Видеоотчёт + фотодокументация", "Сертификаты и мощности производства", "Соответствие образцу до оплаты"],
    price: "от 25 000 ₽",
    hot: false,
    track: null,
  },
  {
    icon: ShoppingCart,
    title: "Выкуп товара",
    desc: "Переводим платёж, контролируем производство. Работаем в юанях.",
    items: ["Оплата в юанях напрямую фабрике", "Контроль производства и отгрузки", "Без скрытых потерь на конвертации"],
    price: "комиссия от 4%",
    hot: false,
    track: null,
  },
  {
    icon: Package,
    title: "Сборные грузы",
    desc: "Консолидация из Иу, Гуанчжоу, Шэньчжэня. Еженедельные отправления.",
    items: ["Авто: от $2.5/кг · Авиа: от $6/кг", "Минимальная партия — от 50 кг", "Еженедельные рейсы в РФ и Казахстан"],
    price: "от $2.5/кг",
    hot: true,
    track: "consolidation",
  },
  {
    icon: ClipboardCheck,
    title: "Контроль качества",
    desc: "Инспекция по AQL-стандарту: замеры, комплектность, фотоотчёт.",
    items: ["Проверка на складе до отправки", "Сравнение с образцом и ТЗ", "Фотоотчёт + заключение Passed/Failed"],
    price: "от 12 000 ₽",
    hot: false,
    track: null,
  },
  {
    icon: Star,
    title: "Под ключ",
    desc: "Поиск → аудит → выкуп → доставка → таможня. Один менеджер на весь цикл.",
    items: ["Полный цикл без вашего участия", "Один контакт — один менеджер", "Отчётность на каждом этапе"],
    price: "по запросу",
    hot: false,
    track: null,
  },
];

export default function Services() {
  const ref = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);
  const cardTracked = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          if (!trackedRef.current) { trackedRef.current = true; analytics.servicesView(); }
        }
      });
    }, { threshold: 0.1 });

    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const key = (e.target as HTMLElement).dataset.track;
        if (!key || cardTracked.current[key]) return;
        cardTracked.current[key] = true;
        if (key === "sourcing")      analytics.serviceSourcingView();
        if (key === "consolidation") analytics.serviceConsolidationView();
      });
    }, { threshold: 0.5 });

    ref.current?.querySelectorAll(".fade-up").forEach(el => fadeObserver.observe(el));
    ref.current?.querySelectorAll("[data-track]").forEach(el => cardObserver.observe(el));
    return () => { fadeObserver.disconnect(); cardObserver.disconnect(); };
  }, []);

  return (
    <section id="services" className="relative py-20 md:py-28 border-t border-[#243a5e] overflow-hidden" ref={ref}>
      <div className="absolute inset-0">
        <Image src="/images/bg-services.jpg" alt="" fill className="object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1F3A]/90 via-[#0B1F3A]/78 to-[#0B1F3A]/90"/>
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 fade-up">
          <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-3">Что мы делаем</p>
          <h2 className="text-3xl md:text-4xl font-bold">Наши услуги</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <div key={s.title}
              data-track={s.track ?? undefined}
              className={`fade-up relative rounded-2xl p-6 flex flex-col hover:-translate-y-1 transition-all duration-200 ${
              s.hot ? "bg-[#00A86B]/10 border border-[#00A86B]/40 glow-green" : "card-glass hover:border-[#00A86B]/30"
            }`} style={{ transitionDelay: `${i * 80}ms` }}>
              {s.hot && (
                <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-[#00A86B] text-white px-2.5 py-1 rounded-full">
                  Популярное
                </span>
              )}
              <div className="inline-flex p-2.5 rounded-xl bg-[#00A86B]/10 mb-4">
                <s.icon className="w-5 h-5 text-[#00A86B]"/>
              </div>
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-[#8899aa] leading-relaxed mb-3">{s.desc}</p>
              {s.items.length > 0 && (
                <ul className="flex flex-col gap-1 mb-4">
                  {s.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs text-[#8899aa]">
                      <span className="text-[#00A86B] mt-0.5 flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              <div className="text-[#00A86B] font-bold text-sm mt-auto">{s.price}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
