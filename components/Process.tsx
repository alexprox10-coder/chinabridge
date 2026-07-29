"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { FileText, Search, Eye, ShoppingCart, Layers, Truck } from "lucide-react";

const steps = [
  { icon: FileText, title: "Заявка", desc: "Вы описываете товар и требования — отвечаем за 15 минут." },
  { icon: Search, title: "Поиск поставщика", desc: "Находим 3–5 производителей, сравниваем цены." },
  { icon: Eye, title: "Проверка фабрики", desc: "Представитель выезжает на производство, шлёт видео." },
  { icon: ShoppingCart, title: "Выкуп товара", desc: "Переводим оплату, контролируем производство." },
  { icon: Layers, title: "Консолидация", desc: "Объединяем грузы на складе в Китае." },
  { icon: Truck, title: "Доставка", desc: "Казахстан 12–18 дней, Россия 10+ дней с треком." },
];

export default function Process() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.1 });
    ref.current?.querySelectorAll(".fade-up").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="process" className="relative py-20 md:py-28 border-t border-[#243a5e] overflow-hidden" ref={ref}>
      <div className="absolute inset-0">
        <Image src="/images/bg-process.jpg" alt="" fill className="object-cover" priority/>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1F3A]/90 via-[#0B1F3A]/78 to-[#0B1F3A]/90"/>
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 fade-up">
          <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-3">Прозрачный процесс</p>
          <h2 className="text-3xl md:text-4xl font-bold">Как мы работаем</h2>
          <p className="text-[#8899aa] mt-4 max-w-xl mx-auto">6 шагов от заявки до доставки — вы видите статус на каждом этапе</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-4">
          {steps.map((step, i) => (
            <div key={step.title} className="fade-up flex flex-col items-center text-center"
              style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-2xl bg-[#0f2644] border border-[#243a5e] flex items-center justify-center hover:border-[#00A86B]/50 transition-colors">
                  <step.icon className="w-8 h-8 text-[#00A86B]"/>
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#00A86B] text-white text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{step.title}</h3>
              <p className="text-xs text-[#8899aa] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center fade-up">
          <button onClick={() => document.querySelector("#calculator")?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-3.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all hover:shadow-lg">
            Начать работу
          </button>
        </div>
      </div>
    </section>
  );
}
