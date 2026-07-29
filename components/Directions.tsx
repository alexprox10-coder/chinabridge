"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const directions = [
  {
    title: "Автозапчасти",
    desc: "Двигатели, кузовные детали, расходники и аксессуары для любых марок автомобилей.",
    photo: "/images/auto-parts.jpg",
    alt: "Автозапчасти из Китая",
    tag: "Популярно",
  },
  {
    title: "Оборудование",
    desc: "Промышленные станки, производственные линии, CNC-оборудование и инструмент.",
    photo: "/images/machinery.jpg",
    alt: "Промышленное оборудование из Китая",
    tag: null,
  },
  {
    title: "Одежда и текстиль",
    desc: "Готовая одежда, ткани, трикотаж, аксессуары и сезонные коллекции оптом.",
    photo: "/images/marketplace.jpg",
    alt: "Одежда и текстиль из Китая",
    tag: null,
  },
  {
    title: "Мебель и интерьер",
    desc: "Мебель под заказ, предметы декора, освещение и элементы интерьера.",
    photo: "/images/furniture.jpg",
    alt: "Мебель из Китая",
    tag: null,
  },
];

export default function Directions() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.08 }
    );
    ref.current?.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="directions" className="py-20 md:py-28 border-t border-[#243a5e]" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 fade-up">
          <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-3">Что мы везём</p>
          <h2 className="text-3xl md:text-4xl font-bold">Наши направления</h2>
          <p className="mt-4 text-[#8899aa] max-w-xl mx-auto">
            Работаем с любым товаром — от небольших партий до крупных контейнерных поставок.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {directions.map((d, i) => (
            <div
              key={d.title}
              className="fade-up group relative rounded-2xl overflow-hidden cursor-pointer"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              {/* Full-bleed photo */}
              <div className="relative aspect-[3/4]">
                <Image
                  src={d.photo}
                  alt={d.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A] via-[#0B1F3A]/30 to-transparent"/>
              </div>

              {/* Tag */}
              {d.tag && (
                <div className="absolute top-4 left-4 px-2.5 py-1 bg-[#00A86B] text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                  {d.tag}
                </div>
              )}

              {/* Text overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-bold text-lg mb-1">{d.title}</h3>
                <p className="text-xs text-[#8899aa] leading-relaxed mb-3">{d.desc}</p>
                <div className="flex items-center gap-1 text-[#00A86B] text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Запросить цену <ArrowRight className="w-3 h-3"/>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="fade-up text-center mt-10">
          <p className="text-[#8899aa] text-sm">
            Не нашли свой товар?{" "}
            <button
              onClick={() => document.querySelector("#calculator")?.scrollIntoView({ behavior: "smooth" })}
              className="text-[#00A86B] font-semibold hover:underline"
            >
              Оставьте заявку — привезём всё
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}
