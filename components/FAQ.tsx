"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Minus } from "lucide-react";

const faqs = [
  { q: "Можно заказать от 50 кг?", a: "Да, именно для небольших партий существуют сборные грузы. Мы объединяем несколько грузов в один контейнер — вы платите только за свою часть. Отправки каждую неделю." },
  { q: "Как проверить поставщика перед оплатой?", a: "Наш представитель в Китае выезжает на производство лично. Вы получаете видео цеха, фото образцов, документы и сертификаты. Оплата поставщику только после вашего одобрения." },
  { q: "Какие сроки доставки?", a: "Казахстан (Алматы, Астана): 12–18 дней. Россия (Благовещенск): от 10 дней. Сроки зависят от загруженности таможни. Вы получаете трек-номер и отслеживаете груз онлайн." },
  { q: "В какой валюте оплачивать?", a: "Вы переводите нам в рублях или тенге по текущему курсу. Переводы в Китай в юанях берём на себя — у нас отработанные каналы без комиссий Swift." },
  { q: "Работаете с Казахстаном?", a: "Да, Казахстан — приоритетное направление. Работаем с Алматы, Астаной, Шымкентом и другими городами. Таможенное оформление берём на себя по желанию." },
  { q: "Что если поставщик окажется мошенником?", a: "Именно поэтому мы не переводим деньги до выезда представителя. Проверяем юрлицо, образцы и мощности производства. За 5 лет работы не потеряли ни одного платежа." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="relative py-20 md:py-28 border-t border-[#243a5e] overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/images/bg-process.jpg" alt="" fill className="object-cover object-center"/>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1F3A]/93 via-[#0B1F3A]/85 to-[#0B1F3A]/93"/>
      </div>
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-3">Частые вопросы</p>
          <h2 className="text-3xl md:text-4xl font-bold">FAQ</h2>
        </div>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <div key={i} className={`rounded-xl border transition-colors ${open === i ? "border-[#00A86B]/40 bg-[#00A86B]/5" : "border-[#243a5e] bg-[#0f2644]/80 backdrop-blur-sm"}`}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                <span className="font-medium text-sm">{faq.q}</span>
                <span className="flex-shrink-0 w-6 h-6 rounded-full border border-[#243a5e] flex items-center justify-center text-[#8899aa]">
                  {open === i ? <Minus className="w-3 h-3"/> : <Plus className="w-3 h-3"/>}
                </span>
              </button>
              {open === i && (
                <p className="px-5 pb-4 text-sm text-[#8899aa] leading-relaxed">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
