"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const FACTS = [
  {
    icon: "🇨🇳",
    title: "Представитель в Китае",
    text: "Сотрудник на месте — проверяет товар, общается с фабрикой, контролирует выкуп.",
  },
  {
    icon: "🔍",
    title: "Проверка поставщиков",
    text: "Инспекция перед отправкой: фотоотчёт, соответствие образцу, реальный адрес фабрики.",
  },
  {
    icon: "📦",
    title: "Сборные грузы от 50 кг",
    text: "Отправляем небольшие партии без переплаты за контейнер — выгодно для малого бизнеса.",
  },
  {
    icon: "🌍",
    title: "Россия и Казахстан",
    text: "Отработанные маршруты через Иу, Гуанчжоу, Шэньчжэнь в обе страны.",
  },
];

export default function TrustBlock() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Почему выбирают нас
          </h2>
          <p className="text-[#8899aa] max-w-xl mx-auto">
            Только проверенные факты — без маркетинговых обещаний
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FACTS.map((fact, i) => (
            <motion.div
              key={fact.title}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-6 flex flex-col gap-3 hover:border-[#00A86B]/40 transition-colors"
            >
              <span className="text-3xl">{fact.icon}</span>
              <h3 className="font-semibold text-white text-base leading-tight">{fact.title}</h3>
              <p className="text-[#8899aa] text-sm leading-relaxed">{fact.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
