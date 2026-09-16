"use client";

import { useState } from "react";

const STAGES = [
  { id: "traffic",         label: "Трафик VK Ads",        event: null,                      color: "#4a9eff", desc: "Клики по рекламе в VK" },
  { id: "service_page",    label: "Сервисная страница",    event: "service_cta_view",        color: "#00A86B", desc: "Просмотр страницы с CTA" },
  { id: "cta_click",       label: "Клик по CTA",           event: "service_cta_click",       color: "#00A86B", desc: "Кнопка 'Получить расчёт'" },
  { id: "calculator",      label: "Калькулятор открыт",   event: "calculator_start",        color: "#00cba8", desc: "Начало расчёта в AI" },
  { id: "calc_done",       label: "Расчёт завершён",      event: "calc_done",               color: "#00cba8", desc: "AI выдал результат" },
  { id: "delivery_start",  label: "Запрос поставки",      event: "delivery_request_start",  color: "#f59e0b", desc: "Кнопка 'Рассчитать поставку'" },
  { id: "delivery_submit", label: "Заявка подана",        event: "delivery_request_submit", color: "#f59e0b", desc: "Форма / Telegram отправлена" },
  { id: "lead_created",    label: "Лид в CRM",            event: "lead_created",            color: "#e74c3c", desc: "Лид создан в базе" },
  { id: "hot",             label: "HOT лид",              event: null,                      color: "#e74c3c", desc: "Квалифицирован менеджером" },
  { id: "quote",           label: "КП отправлено",        event: null,                      color: "#9b59b6", desc: "Коммерческое предложение" },
  { id: "deal",            label: "Сделка",               event: null,                      color: "#9b59b6", desc: "Оплата получена" },
];

const MOCK_DATA = {
  traffic:         { count: 2500, delta: +12 },
  service_page:    { count: 257,  delta: +8  },
  cta_click:       { count: 44,   delta: +15 },
  calculator:      { count: 31,   delta: +5  },
  calc_done:       { count: 18,   delta: -2  },
  delivery_start:  { count: 9,    delta: +22 },
  delivery_submit: { count: 6,    delta: +20 },
  lead_created:    { count: 4,    delta: +33 },
  hot:             { count: 1,    delta: 0   },
  quote:           { count: 1,    delta: 0   },
  deal:            { count: 0,    delta: 0   },
};

function convRate(from: number, to: number) {
  if (!from) return "—";
  return ((to / from) * 100).toFixed(1) + "%";
}

export default function FunnelDashboard() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");

  const counts = MOCK_DATA;
  const maxCount = counts.traffic.count;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Воронка конверсии</h1>
          <p className="text-[#8899aa] text-sm mt-0.5">VK Ads → CTA → Калькулятор → Лид → Сделка</p>
        </div>
        <div className="flex gap-1 bg-[#0B1F3A] border border-[#1a3a5c] rounded-xl p-1">
          {(["today", "week", "month"] as const).map(p => (
            <button key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${period === p ? "bg-[#00A86B] text-white" : "text-[#8899aa] hover:text-white"}`}
            >
              {p === "today" ? "Сегодня" : p === "week" ? "7 дней" : "Месяц"}
            </button>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "VK кликов/день", value: "2,500", sub: "avg", color: "text-[#4a9eff]" },
          { label: "Конверсия CTA", value: convRate(counts.service_page.count, counts.cta_click.count), sub: "page → click", color: "text-[#00A86B]" },
          { label: "Лидов за период", value: String(counts.lead_created.count), sub: "создано в CRM", color: "text-[#f59e0b]" },
          { label: "Итого сделок", value: String(counts.deal.count), sub: "оплачено", color: "text-[#e74c3c]" },
        ].map(m => (
          <div key={m.label} className="bg-[#0B1F3A] border border-[#1a3a5c] rounded-xl p-4">
            <p className="text-[#8899aa] text-xs mb-1">{m.label}</p>
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-[#556677] text-xs mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Funnel stages */}
      <div className="bg-[#0B1F3A] border border-[#1a3a5c] rounded-2xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-[#1a3a5c]">
          <p className="text-xs text-[#8899aa] font-medium uppercase tracking-wider">Этапы воронки</p>
        </div>
        <div className="divide-y divide-[#1a3a5c]">
          {STAGES.map((stage, i) => {
            const count = counts[stage.id as keyof typeof counts]?.count ?? 0;
            const nextCount = i < STAGES.length - 1 ? counts[STAGES[i + 1].id as keyof typeof counts]?.count ?? 0 : 0;
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const cr = i < STAGES.length - 1 ? convRate(count, nextCount) : "—";

            return (
              <div key={stage.id} className="px-4 py-3 flex items-center gap-4 hover:bg-[#0d2545] transition-colors">
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: stage.color + "33", border: `1px solid ${stage.color}` }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{stage.label}</span>
                    <span className="text-sm font-bold" style={{ color: stage.color }}>
                      {count.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#071829] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: stage.color }} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-[#556677]">{stage.desc}</span>
                    {stage.event && (
                      <span className="text-[10px] text-[#556677] font-mono">{stage.event}</span>
                    )}
                  </div>
                </div>
                {i < STAGES.length - 1 && (
                  <div className="text-xs font-medium w-12 text-right flex-shrink-0" style={{ color: parseFloat(cr) < 10 ? "#e74c3c" : "#00A86B" }}>
                    {cr}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Drop-off analysis */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0B1F3A] border border-[#e74c3c]/20 rounded-2xl p-4">
          <p className="text-xs text-[#e74c3c] font-semibold uppercase tracking-wider mb-3">Главные потери</p>
          <div className="flex flex-col gap-2">
            {[
              { stage: "Трафик → Страница", loss: "~90%", note: "Bounce, нет sticky CTA" },
              { stage: "CTA → Калькулятор", loss: "~30%", note: "Нет повторных CTA" },
              { stage: "Расчёт → Заявка", loss: "~50%", note: "Нет follow-up" },
            ].map(d => (
              <div key={d.stage} className="flex items-start gap-2">
                <span className="text-[#e74c3c] text-xs mt-0.5">↓</span>
                <div>
                  <p className="text-xs font-medium text-white">{d.stage}: <span className="text-[#e74c3c]">{d.loss}</span></p>
                  <p className="text-[10px] text-[#556677]">{d.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#0B1F3A] border border-[#00A86B]/20 rounded-2xl p-4">
          <p className="text-xs text-[#00A86B] font-semibold uppercase tracking-wider mb-3">Что задеплоено</p>
          <div className="flex flex-col gap-2">
            {[
              { label: "/white-import sticky CTA", done: true },
              { label: "/kz/auto-parts vertical ctx", done: true },
              { label: "/kz/auto-accessories vertical ctx", done: true },
              { label: "/import/[category] vertical ctx", done: true },
              { label: "service_cta_view/click events", done: true },
              { label: "Funnel dashboard (эта страница)", done: true },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2">
                <span className={f.done ? "text-[#00A86B]" : "text-[#556677]"}>
                  {f.done ? "✓" : "○"}
                </span>
                <span className={`text-xs ${f.done ? "text-white" : "text-[#556677]"}`}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GA4 links */}
      <div className="bg-[#0B1F3A] border border-[#1a3a5c] rounded-2xl p-4">
        <p className="text-xs text-[#8899aa] font-medium uppercase tracking-wider mb-3">События GA4 для отслеживания</p>
        <div className="flex flex-wrap gap-2">
          {["service_cta_view", "service_cta_click", "delivery_request_start", "delivery_request_submit", "sticky_cta_click", "calculator_start", "calc_done"].map(ev => (
            <span key={ev} className="px-2 py-1 bg-[#071829] border border-[#1a3a5c] rounded-lg text-[10px] font-mono text-[#8899aa]">{ev}</span>
          ))}
        </div>
        <p className="text-[#556677] text-xs mt-3">
          Данные выше — демо-значения. Реальные данные доступны в GA4 → Events, Yandex Metrika → Цели, Microsoft Clarity → Events.
        </p>
      </div>
    </div>
  );
}
