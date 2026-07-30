"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { TrendingUp, Clock, ShieldCheck } from "lucide-react";
import { analytics } from "@/lib/analytics";

const cases = [
  { icon: TrendingUp, tag: "Казахстан · Kaspi", title: "Поставщик велосипедов",
    problem: "Продавец на Kaspi искал надёжного поставщика велосипедов для сезонной закупки.",
    solution: "Нашли завод в Тяньцзине, провели проверку, выкупили партию.",
    result: "Сэкономили 32% к ценам Alibaba. Доставка 14 дней.", metric: "−32%", ml: "к цене Alibaba" },
  { icon: Clock, tag: "Россия · Строительство", title: "Опалубка для стройки",
    problem: "Строительной компании срочно нужна была опалубка — 4 тонны.",
    solution: "Нашли поставщика за 2 дня, отправили сборным грузом.",
    result: "4 тонны доставлены за 15 дней без переплат за срочность.", metric: "15 дней", ml: "от заявки до склада" },
  { icon: ShieldCheck, tag: "Казахстан · Электроника", title: "Проверка поставщика",
    problem: "Магазин готовился сделать первую крупную закупку у нового поставщика.",
    solution: "Выехали на фабрику, обнаружили несоответствие образцов.",
    result: "Предотвратили брак до оплаты, сберегли 800 000 ₽.", metric: "800 000 ₽", ml: "сохранено" },
];

export default function Cases() {
  const ref = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          if (!trackedRef.current) { trackedRef.current = true; analytics.casesView(); }
        }
      });
    }, { threshold: 0.1 });
    ref.current?.querySelectorAll(".fade-up").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="cases" className="relative py-20 md:py-28 border-t border-[#243a5e] overflow-hidden" ref={ref}>
      <div className="absolute inset-0">
        <Image src="/images/bg-containers.jpg" alt="" fill className="object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1F3A]/90 via-[#0B1F3A]/78 to-[#0B1F3A]/90"/>
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 fade-up">
          <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-3">Реальные результаты</p>
          <h2 className="text-3xl md:text-4xl font-bold">Кейсы клиентов</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cases.map((c, i) => (
            <div key={c.title} className="fade-up card-glass rounded-2xl p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-200"
              style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8899aa] font-medium">{c.tag}</span>
                <div className="p-2 rounded-lg bg-[#00A86B]/10">
                  <c.icon className="w-4 h-4 text-[#00A86B]"/>
                </div>
              </div>
              <h3 className="font-semibold text-lg">{c.title}</h3>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-[#8899aa]"><span className="text-white/50 uppercase tracking-wider text-[10px] font-medium mr-1">Задача</span>{c.problem}</p>
                <p className="text-xs text-[#8899aa]"><span className="text-white/50 uppercase tracking-wider text-[10px] font-medium mr-1">Решение</span>{c.solution}</p>
              </div>
              <div className="border-t border-[#243a5e]"/>
              <div className="flex items-end justify-between">
                <p className="text-xs text-[#8899aa] flex-1 pr-4">{c.result}</p>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-[#00A86B]">{c.metric}</div>
                  <div className="text-[10px] text-[#8899aa]">{c.ml}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
