"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { trackGAEvent } from "@/lib/analytics/ga";

const checks = [
  "Товар на полке WB/Ozon за 25–35 дней",
  "Поставщик + проверка фабрики в Китае",
  "Таможня + документы под ключ",
  "AI-расчёт маржи до закупки",
];

function RouteMap() {
  return (
    <svg viewBox="0 0 620 300" className="w-full h-full" aria-hidden="true">
      <defs>
        <radialGradient id="mapGlow" cx="35%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#00A86B" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#00A86B" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <ellipse cx="220" cy="150" rx="200" ry="130" fill="url(#mapGlow)" />

      {/* Region blobs */}
      <path d="M100,60 Q160,38 210,55 Q255,72 268,105 Q280,138 258,162 Q230,185 195,175 Q155,162 128,140 Q100,118 95,88 Q92,72 100,60Z"
        fill="rgba(0,168,107,0.07)" stroke="#243a5e" strokeWidth="1" opacity="0.8"/>
      <path d="M340,35 Q410,18 480,38 Q545,58 555,92 Q562,126 535,148 Q498,168 450,158 Q400,148 368,120 Q338,95 340,65 Q340,48 340,35Z"
        fill="rgba(0,168,107,0.05)" stroke="#243a5e" strokeWidth="1" opacity="0.7"/>
      <path d="M60,190 Q110,170 165,182 Q215,194 228,228 Q234,258 200,272 Q165,285 122,278 Q82,270 65,245 Q48,218 60,190Z"
        fill="rgba(0,168,107,0.05)" stroke="#243a5e" strokeWidth="1" opacity="0.7"/>

      {/* Route paths */}
      <path id="r1" d="M210,110 C290,70 370,68 460,90"
        fill="none" stroke="#00A86B" strokeWidth="2.5" strokeDasharray="8 5" strokeLinecap="round" opacity="0.9">
        <animate attributeName="stroke-dashoffset" from="0" to="-100" dur="3s" repeatCount="indefinite"/>
      </path>
      <path id="r2" d="M210,130 C195,175 175,200 148,240"
        fill="none" stroke="#00A86B" strokeWidth="2.5" strokeDasharray="8 5" strokeLinecap="round" opacity="0.9">
        <animate attributeName="stroke-dashoffset" from="0" to="-100" dur="3.8s" repeatCount="indefinite"/>
      </path>
      <path id="r3" d="M210,118 C290,118 360,128 430,148"
        fill="none" stroke="#00A86B" strokeWidth="1.8" strokeDasharray="5 6" strokeLinecap="round" opacity="0.55">
        <animate attributeName="stroke-dashoffset" from="0" to="-80" dur="5s" repeatCount="indefinite"/>
      </path>

      {/* Moving cargo */}
      <rect width="18" height="11" rx="2.5" fill="#00A86B" opacity="0.9">
        <animateMotion dur="3s" repeatCount="indefinite" rotate="auto"><mpath href="#r1"/></animateMotion>
      </rect>
      <rect width="18" height="11" rx="2.5" fill="#00A86B" opacity="0.85">
        <animateMotion dur="3.8s" repeatCount="indefinite" rotate="auto" begin="1.5s"><mpath href="#r2"/></animateMotion>
      </rect>

      {/* ── CHINA — пульсирующий центр ── */}
      <circle cx="210" cy="120" r="30" fill="#00A86B" opacity="0.06">
        <animate attributeName="r" values="30;44;30" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="210" cy="120" r="15" fill="#00A86B" opacity="0.15">
        <animate attributeName="r" values="15;20;15" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="210" cy="120" r="9" fill="#00A86B" opacity="1"/>
      <text x="228" y="113" fill="white" fontSize="18" fontWeight="800" letterSpacing="0.5">Китай</text>
      <text x="228" y="133" fill="#6699aa" fontSize="12">представитель</text>

      {/* ── MOSCOW ── */}
      <circle cx="460" cy="90" r="20" fill="#00A86B" opacity="0.08">
        <animate attributeName="r" values="20;28;20" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="460" cy="90" r="9" fill="#00A86B" opacity="0.95"/>
      <text x="474" y="84" fill="white" fontSize="16" fontWeight="700">Москва</text>
      <text x="474" y="102" fill="#6699aa" fontSize="12">10+ дней</text>

      {/* ── KAZAKHSTAN ── */}
      <circle cx="148" cy="240" r="20" fill="#00A86B" opacity="0.08">
        <animate attributeName="r" values="20;28;20" dur="3.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="148" cy="240" r="9" fill="#00A86B" opacity="0.95"/>
      <text x="164" y="234" fill="white" fontSize="16" fontWeight="700">Казахстан</text>
      <text x="164" y="252" fill="#6699aa" fontSize="12">12–18 дней</text>

      {/* ── BLAGOVESHCHENSK ── */}
      <circle cx="430" cy="148" r="7" fill="#00A86B" opacity="0.75"/>
      <circle cx="430" cy="148" r="14" fill="#00A86B" opacity="0.08"/>
      <text x="444" y="144" fill="#aac4cc" fontSize="13" fontWeight="600">Благовещенск</text>
      <text x="444" y="159" fill="#6699aa" fontSize="11">от 10 дней</text>
    </svg>
  );
}

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll(".fade-up").forEach((item, i) => {
      setTimeout(() => item.classList.add("visible"), i * 110);
    });
  }, []);

  const scrollTo = (href: string) => document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20" ref={ref}>
      {/* ── Фоновые слои Hero ── */}
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#040d1a] via-[#0B1F3A] to-[#071628]"/>

      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(0,168,107,0.10) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
      }}/>

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-[10%] w-[500px] h-[500px] rounded-full bg-[#00A86B]/6 blur-[140px] pointer-events-none"/>
      <div className="absolute bottom-0 right-[5%] w-[420px] h-[420px] rounded-full bg-[#00A86B]/5 blur-[120px] pointer-events-none"/>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[#0d3060]/60 blur-[80px] pointer-events-none"/>

      {/* Animated SVG background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes hero-drift{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
          @keyframes hero-flow{to{stroke-dashoffset:-200}}
          @keyframes hero-blink{0%,100%{opacity:.2}50%{opacity:.7}}
          @keyframes hero-spin{from{transform-origin:50% 50%;transform:rotate(0deg)}to{transform-origin:50% 50%;transform:rotate(360deg)}}
        `}</style>

        {/* Long flowing trade-route arcs */}
        <path d="M-100,680 Q360,400 720,520 Q1080,640 1540,380"
          stroke="#00A86B" strokeWidth="1.5" strokeDasharray="14 10" strokeLinecap="round" opacity="0.15">
          <animate attributeName="stroke-dashoffset" from="0" to="-200" dur="10s" repeatCount="indefinite"/>
        </path>
        <path d="M-100,500 Q400,250 750,380 Q1100,500 1540,260"
          stroke="#00A86B" strokeWidth="1" strokeDasharray="10 14" strokeLinecap="round" opacity="0.10">
          <animate attributeName="stroke-dashoffset" from="0" to="-200" dur="14s" repeatCount="indefinite"/>
        </path>
        <path d="M-100,820 Q500,600 900,700 Q1200,780 1540,580"
          stroke="#00A86B" strokeWidth="1" strokeDasharray="8 16" strokeLinecap="round" opacity="0.08">
          <animate attributeName="stroke-dashoffset" from="0" to="-200" dur="18s" repeatCount="indefinite"/>
        </path>

        {/* Moving cargo container dots on route 1 */}
        <rect width="16" height="10" rx="2" fill="#00A86B" opacity="0.55">
          <animateMotion dur="10s" repeatCount="indefinite" rotate="auto">
            <mpath href="#hr1"/>
          </animateMotion>
        </rect>
        <path id="hr1" d="M-100,680 Q360,400 720,520 Q1080,640 1540,380"/>

        <rect width="12" height="8" rx="2" fill="#00A86B" opacity="0.4">
          <animateMotion dur="14s" repeatCount="indefinite" rotate="auto" begin="4s">
            <mpath href="#hr2"/>
          </animateMotion>
        </rect>
        <path id="hr2" d="M-100,500 Q400,250 750,380 Q1100,500 1540,260"/>

        {/* Floating pulse nodes */}
        {[
          {cx:180, cy:640, d:"3.5s", r:5},
          {cx:420, cy:430, d:"5s", r:4},
          {cx:720, cy:520, d:"4s", r:6},
          {cx:1000, cy:400, d:"6s", r:5},
          {cx:1280, cy:300, d:"3s", r:4},
          {cx:600, cy:700, d:"7s", r:3},
          {cx:870, cy:200, d:"5.5s", r:4},
        ].map((n, i) => (
          <g key={i}>
            <circle cx={n.cx} cy={n.cy} r={n.r + 10} fill="#00A86B" opacity="0.04"/>
            <circle cx={n.cx} cy={n.cy} r={n.r} fill="#00A86B" opacity="0.28">
              <animate attributeName="opacity" values="0.12;0.55;0.12" dur={n.d} repeatCount="indefinite"/>
              <animate attributeName="r" values={`${n.r};${n.r+3};${n.r}`} dur={n.d} repeatCount="indefinite"/>
            </circle>
            <circle cx={n.cx} cy={n.cy} r={n.r * 0.5} fill="#00A86B" opacity="0.8"/>
          </g>
        ))}

        {/* Floating hexagons (geometric accent) */}
        {[
          {x:80, y:200, size:40, delay:"0s"},
          {x:1300, y:650, size:56, delay:"2s"},
          {x:1100, y:150, size:32, delay:"4s"},
          {x:300, y:780, size:48, delay:"1s"},
        ].map((h, i) => (
          <polygon key={i}
            points={`${h.x},${h.y-h.size} ${h.x+h.size*0.866},${h.y-h.size*0.5} ${h.x+h.size*0.866},${h.y+h.size*0.5} ${h.x},${h.y+h.size} ${h.x-h.size*0.866},${h.y+h.size*0.5} ${h.x-h.size*0.866},${h.y-h.size*0.5}`}
            stroke="#00A86B" strokeWidth="1" fill="none" opacity="0.08"
            style={{animation:`hero-drift ${6+i*1.5}s ease-in-out infinite`, animationDelay:h.delay}}
          />
        ))}

        {/* Small star particles */}
        {[
          {cx:150,cy:300},{cx:520,cy:160},{cx:900,cy:760},{cx:1200,cy:500},
          {cx:350,cy:550},{cx:680,cy:280},{cx:1050,cy:680},{cx:230,cy:780},
        ].map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r="1.5" fill="white" opacity="0.18">
            <animate attributeName="opacity" values="0.08;0.35;0.08" dur={`${3+i*0.7}s`} repeatCount="indefinite"/>
          </circle>
        ))}
      </svg>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* LEFT — текст */}
          <div>
            <div className="fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00A86B]/30 bg-[#00A86B]/10 text-[#00A86B] text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"/>
              Работаем с 2019 года · 500+ поставок
            </div>

            <h1 className="fade-up text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-5">
              Ваш товар на полке<br/>
              <span className="text-gradient">WB и Ozon из Китая</span>
            </h1>

            <p className="fade-up text-lg text-[#8899aa] leading-relaxed mb-7 max-w-lg">
              Находим поставщика, проверяем фабрику, везём, растамаживаем и отправляем на склад маркетплейса. Вы получаете готовый товар — и считаете прибыль.
            </p>

            <ul className="fade-up flex flex-col gap-2.5 mb-9">
              {checks.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B] flex-shrink-0"/>
                  <span className="text-[#8899aa]">{item}</span>
                </li>
              ))}
            </ul>

            <div className="fade-up flex flex-col sm:flex-row gap-3">
              <Link
                href="/ai-calculator"
                className="btn-primary"
                onClick={() => trackGAEvent("hero_calc_click")}
              >
                Рассчитать прибыль <ArrowRight className="w-4 h-4"/>
              </Link>
              <Link
                href="#launch-package"
                className="btn-outline"
                onClick={(e) => { e.preventDefault(); trackGAEvent("hero_package_click"); document.querySelector("#launch-package")?.scrollIntoView({ behavior: "smooth" }); }}
              >
                Пакеты запуска
              </Link>
            </div>

            <div className="fade-up flex gap-8 mt-10 pt-8 border-t border-[#243a5e]">
              {[{ v: "500+", l: "успешных поставок" }, { v: "25–35", l: "дней до полки WB" }, { v: "20–40%", l: "экономия vs Alibaba" }].map(s => (
                <div key={s.l}>
                  <div className="text-2xl font-bold">{s.v}</div>
                  <div className="text-xs text-[#8899aa] mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — фото фабрики + карта */}
          <div className="fade-up hidden lg:flex flex-col gap-4">
            {/* Hero image */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden card-glass glow-green">
              <Image
                src="/images/hero-factory.jpg"
                alt="Представитель ChinaBridge проверяет товар на китайской фабрике"
                fill
                className="object-cover"
                priority
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              {/* Overlay badge */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-[#0B1F3A]/90 backdrop-blur-sm border border-[#243a5e] rounded-xl px-3 py-2">
                <span className="text-lg">🇨🇳</span>
                <div>
                  <div className="text-xs font-bold text-white">Китай</div>
                  <div className="text-[10px] text-[#8899aa]">Проверяем производителей лично</div>
                </div>
              </div>
              {/* Fallback when no image */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0f2644] to-[#0B1F3A] -z-10">
                <RouteMap/>
              </div>
            </div>

            {/* Mini route map */}
            <div className="relative w-full card-glass rounded-2xl p-4" style={{ height: "360px" }}>
              <RouteMap/>
              <div className="absolute top-3 right-3 bg-[#00A86B] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">
                Еженедельные рейсы
              </div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => scrollTo("#advantages")}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#8899aa] hover:text-white transition-colors animate-bounce">
        <ChevronDown className="w-6 h-6"/>
      </button>
    </section>
  );
}
