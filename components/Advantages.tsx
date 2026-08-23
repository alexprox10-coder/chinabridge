"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Factory, Search, Package, FileCheck } from "lucide-react";


const advantages = [
  {
    icon: Factory,
    title: "Представитель в Китае",
    desc: "Контроль поставщиков на месте. Выезжаем лично, не работаем через посредников.",
    photo: "/images/rep-china.jpg",
    alt: "Представитель ChinaBridge на китайской фабрике",
  },
  {
    icon: Search,
    title: "Проверка фабрик",
    desc: "Видео и фото производства до оплаты. Платёж только после подтверждения качества.",
    photo: "/images/quality-check.jpg",
    alt: "Инспектор проверяет качество продукции",
  },
  {
    icon: Package,
    title: "Сборные грузы",
    desc: "Начинаем работу от 50 кг. Еженедельные рейсы — не ждёте полного контейнера.",
    photo: "/images/warehouse.jpg",
    alt: "Склад с грузами ChinaBridge",
  },
  {
    icon: FileCheck,
    title: "ГТД и документы под ключ",
    desc: "Выдаём ГТД с номером для листинга на WB и Ozon. Сертификаты качества и тех. паспорта — готово к ЕАЭС-декларации.",
    photo: "/images/delivery.jpg",
    alt: "Официальные документы для маркетплейсов",
  },
];

export default function Advantages() {
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
    <section id="advantages" className="relative py-20 md:py-28 overflow-hidden" ref={ref}>
      <div className="absolute inset-0">
        <Image src="/images/bg-advantages.jpg" alt="" fill className="object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1F3A]/92 via-[#0B1F3A]/80 to-[#0B1F3A]/92"/>
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 fade-up">
          <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-3">Почему выбирают нас</p>
          <h2 className="text-3xl md:text-4xl font-bold">Надёжный партнёр по всей цепочке</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {advantages.map((adv, i) => (
            <div
              key={adv.title}
              className="fade-up card-glass rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-200 group"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Photo */}
              <div className="relative w-full aspect-[4/3] overflow-hidden">
                <Image
                  src={adv.photo}
                  alt={adv.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A]/60 to-transparent"/>
                <div className="absolute bottom-3 left-3 p-2 rounded-lg bg-[#00A86B]/20 backdrop-blur-sm border border-[#00A86B]/30">
                  <adv.icon className="w-4 h-4 text-[#00A86B]"/>
                </div>
              </div>
              {/* Text */}
              <div className="p-5">
                <h3 className="font-semibold mb-2 leading-snug">{adv.title}</h3>
                <p className="text-sm text-[#8899aa] leading-relaxed">{adv.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
