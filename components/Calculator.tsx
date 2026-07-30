"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { leadSchema, LeadFormData } from "@/lib/validation";
import { saveLead } from "@/lib/supabase";
import { analytics } from "@/lib/analytics";

function fireworks() {
  if (typeof window === "undefined") return;
  const colors = ["#00A86B", "#ffffff", "#EF9F27"];
  let i = 0;
  const interval = setInterval(() => {
    const el = document.createElement("div");
    el.style.cssText = `position:fixed;width:8px;height:8px;border-radius:50%;background:${colors[i % 3]};
      left:${30 + Math.random() * 40}%;top:${20 + Math.random() * 60}%;
      animation:pop 0.8s ease-out forwards;pointer-events:none;z-index:9999`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
    if (++i > 30) clearInterval(interval);
  }, 60);
}

const inp = (err: boolean) =>
  `w-full px-3.5 py-2.5 bg-[#0B1F3A] border rounded-xl text-sm placeholder:text-[#8899aa] outline-none transition-colors ${
    err ? "border-red-500/60 focus:border-red-400" : "border-[#243a5e] focus:border-[#00A86B]/60"
  }`;

export default function Calculator() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { country: "Казахстан" },
  });

  const onSubmit = async (data: LeadFormData) => {
    setServerError(null);
    analytics.formSubmit();
    try {
      await saveLead(data);
      setSubmitted(true);
      fireworks();
      reset();
    } catch {
      setServerError("Не удалось отправить. Напишите нам: @chinabridge");
    }
  };

  return (
    <section id="calculator" className="relative py-20 md:py-28 border-t border-[#243a5e] overflow-hidden">
      <style>{`
        @keyframes pop{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(3) translateY(-40px)}}
        @keyframes drift{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
        @keyframes dash-flow{to{stroke-dashoffset:-120}}
        @keyframes pulse-dot{0%,100%{opacity:.4;r:4}50%{opacity:1;r:6}}
      `}</style>

      {/* ── Декоративный фон ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#060f1e] via-[#0B1F3A] to-[#060f1e]"/>
        {/* Green glow left */}
        <div className="absolute -left-48 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#00A86B]/8 blur-[120px]"/>
        {/* Green glow right */}
        <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#00A86B]/5 blur-[100px]"/>
        {/* Dot grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle, rgba(0,168,107,0.12) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}/>
        {/* Animated SVG routes */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Flowing trade routes */}
          <path d="M-50,250 Q200,100 400,200 Q600,300 800,180 Q1000,60 1300,200"
            stroke="#00A86B" strokeWidth="1.5" strokeDasharray="12 8" strokeLinecap="round" opacity="0.18">
            <animate attributeName="stroke-dashoffset" from="0" to="-120" dur="8s" repeatCount="indefinite"/>
          </path>
          <path d="M-50,350 Q250,200 500,320 Q700,420 950,280 Q1100,200 1300,320"
            stroke="#00A86B" strokeWidth="1" strokeDasharray="8 10" strokeLinecap="round" opacity="0.12">
            <animate attributeName="stroke-dashoffset" from="0" to="-120" dur="11s" repeatCount="indefinite"/>
          </path>
          <path d="M-50,150 Q300,80 550,150 Q800,220 1050,130 Q1200,80 1350,150"
            stroke="#00A86B" strokeWidth="1" strokeDasharray="6 12" strokeLinecap="round" opacity="0.1">
            <animate attributeName="stroke-dashoffset" from="0" to="-120" dur="14s" repeatCount="indefinite"/>
          </path>
          {/* Floating node dots */}
          {[{cx:200,cy:120,d:"3s"},{cx:480,cy:220,d:"4s"},{cx:720,cy:160,d:"5s"},{cx:960,cy:100,d:"3.5s"},{cx:1100,cy:240,d:"6s"}].map((n,i)=>(
            <g key={i}>
              <circle cx={n.cx} cy={n.cy} r="14" fill="#00A86B" opacity="0.04"/>
              <circle cx={n.cx} cy={n.cy} r="5" fill="#00A86B" opacity="0.25">
                <animate attributeName="opacity" values="0.15;0.5;0.15" dur={n.d} repeatCount="indefinite"/>
              </circle>
              <circle cx={n.cx} cy={n.cy} r="2.5" fill="#00A86B" opacity="0.7"/>
            </g>
          ))}
          {/* Cargo box icons */}
          {[{x:350,y:200},{x:800,y:160}].map((b,i)=>(
            <g key={i} opacity="0.12" style={{animation:`drift ${5+i*2}s ease-in-out infinite`}}>
              <rect x={b.x} y={b.y} width="24" height="18" rx="3" stroke="#00A86B" strokeWidth="1.2"/>
              <line x1={b.x} y1={b.y+9} x2={b.x+24} y2={b.y+9} stroke="#00A86B" strokeWidth="0.8"/>
              <line x1={b.x+12} y1={b.y} x2={b.x+12} y2={b.y+18} stroke="#00A86B" strokeWidth="0.8"/>
            </g>
          ))}
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-3">Бесплатная консультация</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Оставьте заявку —<br/><span className="text-gradient">ответим за 15 минут</span>
            </h2>
            <p className="text-[#8899aa] leading-relaxed mb-8">
              Опишите товар, и мы пришлём расчёт с ценами от производителя, стоимостью доставки и сроками.
            </p>
            <ul className="flex flex-col gap-3">
              {["Бесплатный расчёт без обязательств", "Менеджер свяжется в Telegram или по телефону", "Работаем с Казахстаном и Россией"].map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-[#8899aa]">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B] flex-shrink-0"/>{item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            {submitted ? (
              <div className="card-glass rounded-2xl p-10 text-center glow-green">
                <div className="w-16 h-16 rounded-full bg-[#00A86B]/20 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-8 h-8 text-[#00A86B]"/>
                </div>
                <h3 className="text-xl font-bold mb-2">Заявка принята!</h3>
                <p className="text-[#8899aa] mb-6">
                  Ответим в течение 15 минут.<br/>
                  Или сразу: <a href="https://t.me/chinabridge" className="text-[#00A86B] hover:underline">@chinabridge</a>
                </p>
                <button onClick={() => setSubmitted(false)} className="text-sm text-[#8899aa] hover:text-white underline">
                  Отправить ещё одну заявку
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="card-glass rounded-2xl p-6 md:p-8 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Имя *</label>
                    <input {...register("name")} placeholder="Ваше имя" className={inp(!!errors.name)}/>
                    {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Телефон *</label>
                    <input {...register("phone")} type="tel" placeholder="+7 (777) 000-00-00" className={inp(!!errors.phone)}/>
                    {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Telegram</label>
                    <input {...register("telegram")} placeholder="@username" className={inp(false)}/>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Страна доставки *</label>
                    <select {...register("country")} className={inp(!!errors.country)}>
                      <option value="Казахстан">Казахстан</option>
                      <option value="Россия">Россия</option>
                      <option value="Оба направления">Оба направления</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Товар *</label>
                  <input {...register("product")} placeholder="Например: велосипеды горные 26&quot;" className={inp(!!errors.product)}/>
                  {errors.product && <p className="text-xs text-red-400 mt-1">{errors.product.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Количество</label>
                    <input {...register("quantity")} placeholder="50 шт." className={inp(false)}/>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Вес (кг)</label>
                    <input {...register("weight")} placeholder="200 кг" className={inp(false)}/>
                  </div>
                </div>

                {serverError && <p className="text-red-400 text-sm">{serverError}</p>}

                <button type="submit" disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-60 text-white font-semibold rounded-xl transition-all mt-2 hover:shadow-lg">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin"/>Отправляем...</> : <><Send className="w-4 h-4"/>Получить расчёт</>}
                </button>
                <p className="text-xs text-[#8899aa] text-center">Нажимая кнопку, вы соглашаетесь с обработкой персональных данных</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
