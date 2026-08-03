"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { CheckCircle2 } from "lucide-react";

const ADVANTAGES = [
  "Мгновенный AI-расчёт стоимости доставки",
  "Подбор оптимального маршрута",
  "Контроль груза от выкупа до получения",
  "Работаем с Россией и Казахстаном",
  "Менеджер свяжется за 15 минут",
];

const CHAIN = [
  { icon: "🇨🇳", label: "Китай" },
  { icon: "🔍", label: "Проверка" },
  { icon: "🛒", label: "Выкуп" },
  { icon: "📦", label: "Сборка" },
  { icon: "🚚", label: "Доставка" },
  { icon: "✅", label: "Получение" },
];

export default function Calculator() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="calculator"
      ref={ref}
      className="relative py-20 md:py-28 border-t border-[#243a5e] overflow-hidden"
      itemScope
      itemType="https://schema.org/Service"
    >
      <meta itemProp="name" content="Расчёт стоимости доставки из Китая" />
      <meta itemProp="provider" content="ChinaBridge" />
      <meta itemProp="areaServed" content="Россия, Казахстан" />
      <meta itemProp="serviceType" content="Доставка грузов из Китая" />

      <style>{`
        @keyframes chain-pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,168,107,0)}50%{box-shadow:0 0 0 6px rgba(0,168,107,0.15)}}
      `}</style>

      {/* ── Background ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#060f1e] via-[#0B1F3A] to-[#060f1e]"/>
        <div className="absolute -left-48 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#00A86B]/8 blur-[120px]"/>
        <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#00A86B]/5 blur-[100px]"/>
        <div className="absolute inset-0" style={{backgroundImage:"radial-gradient(circle, rgba(0,168,107,0.12) 1px, transparent 1px)",backgroundSize:"40px 40px"}}/>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-50,250 Q200,100 400,200 Q600,300 800,180 Q1000,60 1300,200"
            stroke="#00A86B" strokeWidth="1.5" strokeDasharray="12 8" strokeLinecap="round" opacity="0.18">
            <animate attributeName="stroke-dashoffset" from="0" to="-120" dur="8s" repeatCount="indefinite"/>
          </path>
          <path d="M-50,350 Q250,200 500,320 Q700,420 950,280 Q1100,200 1300,320"
            stroke="#00A86B" strokeWidth="1" strokeDasharray="8 10" strokeLinecap="round" opacity="0.12">
            <animate attributeName="stroke-dashoffset" from="0" to="-120" dur="11s" repeatCount="indefinite"/>
          </path>
          {[{cx:200,cy:120,d:"3s"},{cx:480,cy:220,d:"4s"},{cx:720,cy:160,d:"5s"},{cx:960,cy:100,d:"3.5s"},{cx:1100,cy:240,d:"6s"}].map((n,i)=>(
            <g key={i}>
              <circle cx={n.cx} cy={n.cy} r="14" fill="#00A86B" opacity="0.04"/>
              <circle cx={n.cx} cy={n.cy} r="5" fill="#00A86B" opacity="0.25">
                <animate attributeName="opacity" values="0.15;0.5;0.15" dur={n.d} repeatCount="indefinite"/>
              </circle>
              <circle cx={n.cx} cy={n.cy} r="2.5" fill="#00A86B" opacity="0.7"/>
            </g>
          ))}
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* ── Left: selling block ── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-3">
              AI-Калькулятор доставки
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-5" itemProp="description">
              Рассчитайте доставку<br/>
              <span className="text-gradient">из Китая за 30 секунд</span>
            </h2>
            <p className="text-[#8899aa] leading-relaxed mb-8">
              Заполните форму — AI подберёт маршрут и рассчитает стоимость. Никаких обязательств.
            </p>

            {/* Advantages */}
            <ul className="flex flex-col gap-3 mb-10">
              {ADVANTAGES.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.1 + i * 0.07 }}
                  className="flex items-center gap-2.5 text-sm text-[#8899aa]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B] flex-shrink-0"/>
                  {item}
                </motion.li>
              ))}
            </ul>

            {/* Logistics chain */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.55 }}
            >
              <p className="text-xs font-semibold text-[#8899aa] uppercase tracking-widest mb-4">
                Цепочка доставки
              </p>
              <div className="flex flex-wrap items-center gap-y-4">
                {CHAIN.map((item, i) => (
                  <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-10 h-10 rounded-full bg-[#00A86B]/15 border border-[#00A86B]/30 flex items-center justify-center text-lg"
                        style={{animation:`chain-pulse ${2.5 + i * 0.45}s ease-in-out infinite`}}
                      >
                        {item.icon}
                      </div>
                      <span className="text-[10px] text-[#8899aa] whitespace-nowrap font-medium">{item.label}</span>
                    </div>
                    {i < CHAIN.length - 1 && (
                      <div className="w-5 sm:w-7 h-px bg-gradient-to-r from-[#00A86B]/40 to-[#00A86B]/10 mx-0.5 mb-[18px]"/>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* ── Right: calculator ── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <CalculatorForm />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
