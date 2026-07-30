"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Search, Eye, ShoppingCart, Package, ClipboardCheck, Star } from "lucide-react";
import { analytics } from "@/lib/analytics";

const services = [
  { icon: Search, title: "Поиск поставщика", desc: "3–5 проверенных производителей, сравнительная таблица цен.", price: "от 15 000 ₽", hot: false },
  { icon: Eye, title: "Проверка фабрики", desc: "Выезд на производство, видеоотчёт, сертификаты, мощности.", price: "от 25 000 ₽", hot: false },
  { icon: ShoppingCart, title: "Выкуп товара", desc: "Переводим платёж, контролируем производство. Работаем в юанях.", price: "комиссия 5–8%", hot: false },
  { icon: Package, title: "Сборные грузы", desc: "Консолидация от 50 кг. Еженедельные отправления.", price: "от 50 кг", hot: true },
  { icon: ClipboardCheck, title: "Контроль качества", desc: "Инспекция на складе, замеры, комплектность, фотоотчёт.", price: "от 12 000 ₽", hot: false },
  { icon: Star, title: "Под ключ", desc: "Поиск → проверка → выкуп → доставка. Один менеджер.", price: "по запросу", hot: false },
];

export default function Services() {
  const ref = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          if (!trackedRef.current) { trackedRef.current = true; analytics.servicesView(); }
        }
      });
    }, { threshold: 0.1 });
    ref.current?.querySelectorAll(".fade-up").forEach(el => observer.observe(el));
    return () => observer.disconnect();
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
            <div key={s.title} className={`fade-up relative rounded-2xl p-6 hover:-translate-y-1 transition-all duration-200 ${
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
              <p className="text-sm text-[#8899aa] leading-relaxed mb-4">{s.desc}</p>
              <div className="text-[#00A86B] font-bold text-sm">{s.price}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
