"use client";

import { useState, useEffect } from "react";

const STAGES = [
  { id: "traffic",         label: "Трафик VK Ads",       event: null,                      color: "#4a9eff", desc: "Клики по рекламе в VK" },
  { id: "service_page",   label: "Сервисная страница",   event: "service_cta_view",        color: "#00A86B", desc: "Просмотр страницы с CTA" },
  { id: "cta_click",      label: "Клик по CTA",          event: "service_cta_click",       color: "#00A86B", desc: "Кнопка 'Получить расчёт'" },
  { id: "calculator",     label: "Калькулятор открыт",   event: "calculator_start",        color: "#00cba8", desc: "Начало расчёта в AI" },
  { id: "calc_done",      label: "Расчёт завершён",      event: "calc_done",               color: "#00cba8", desc: "AI выдал результат" },
  { id: "delivery_start", label: "Запрос поставки",      event: "delivery_request_start",  color: "#f59e0b", desc: "Кнопка 'Рассчитать поставку'" },
  { id: "delivery_submit",label: "Заявка подана",        event: "delivery_request_submit", color: "#f59e0b", desc: "Форма / Telegram отправлена" },
  { id: "lead_created",   label: "Лид в CRM",            event: "lead_created",            color: "#e74c3c", desc: "Лид создан в базе", real: true },
  { id: "hot",            label: "HOT лид",              event: null,                      color: "#e74c3c", desc: "Квалифицирован менеджером", real: true },
  { id: "quote",          label: "КП отправлено",        event: null,                      color: "#9b59b6", desc: "Коммерческое предложение", real: true },
  { id: "deal",           label: "Сделка",               event: null,                      color: "#9b59b6", desc: "Оплата получена", real: true },
];

// Upper-funnel estimated counts (GA4 not connected — based on traffic estimates)
const UPPER_ESTIMATES = {
  traffic:         2500,
  service_page:    257,
  cta_click:       44,
  calculator:      31,
  calc_done:       18,
  delivery_start:  9,
  delivery_submit: 6,
};

interface RealStats {
  lead_created:    number;
  week_leads:      number;
  hot:             number;
  quote:           number;
  deal:            number;
  calculator_used: number;
  by_vertical:     Record<string, number>;
  by_country:      Record<string, number>;
  last_updated:    string;
}

function convRate(from: number, to: number) {
  if (!from) return "—";
  return ((to / from) * 100).toFixed(1) + "%";
}

const VERTICAL_LABELS: Record<string, string> = {
  white_import:     "Белый импорт",
  electronics:      "Электроника",
  auto_parts:       "Автозапчасти",
  auto_accessories: "Авто аксессуары",
  clothing:         "Одежда",
  furniture:        "Мебель",
  equipment:        "Оборудование",
  lighting:         "Освещение",
  other:            "Прочее",
};

export default function FunnelDashboard() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const [real, setReal] = useState<RealStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/funnel-stats")
      .then(r => r.json())
      .then(d => { if (!d.error) setReal(d); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const counts: Record<string, number> = {
    ...UPPER_ESTIMATES,
    lead_created:    real?.lead_created ?? 0,
    hot:             real?.hot          ?? 0,
    quote:           real?.quote        ?? 0,
    deal:            real?.deal         ?? 0,
  };

  const maxCount = counts.traffic;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Воронка конверсии</h1>
          <p className="text-[#8899aa] text-sm mt-0.5">VK Ads → CTA → Калькулятор → Лид → Сделка</p>
        </div>
        <div className="flex items-center gap-3">
          {real && (
            <span className="text-[10px] text-[#00A86B] font-mono">
              CRM обновлён {new Date(real.last_updated).toLocaleTimeString("ru")}
            </span>
          )}
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
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "VK кликов/день",   value: "2,500",                                    sub: "avg за период",   color: "text-[#4a9eff]", real: false },
          { label: "Конверсия CTA",    value: convRate(counts.service_page, counts.cta_click), sub: "page → click", color: "text-[#00A86B]", real: false },
          { label: "Лидов (CRM)",      value: loading ? "…" : String(counts.lead_created), sub: "создано в базе", color: "text-[#f59e0b]", real: true  },
          { label: "Калькулятор+лид",  value: loading ? "…" : String(real?.calculator_used ?? 0), sub: "calculator_used=true", color: "text-[#00cba8]", real: true },
        ].map(m => (
          <div key={m.label} className="bg-[#0B1F3A] border border-[#1a3a5c] rounded-xl p-4">
            <p className="text-[#8899aa] text-xs mb-1 flex items-center gap-1.5">
              {m.label}
              {m.real && <span className="px-1.5 py-0.5 bg-[#00A86B]/15 border border-[#00A86B]/30 text-[#00A86B] text-[9px] rounded font-medium">live</span>}
            </p>
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-[#556677] text-xs mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Funnel stages */}
      <div className="bg-[#0B1F3A] border border-[#1a3a5c] rounded-2xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-[#1a3a5c] flex items-center justify-between">
          <p className="text-xs text-[#8899aa] font-medium uppercase tracking-wider">Этапы воронки</p>
          <div className="flex gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-[#8899aa]"><span className="w-2 h-2 rounded-full bg-[#556677]" />Оценочно</span>
            <span className="flex items-center gap-1 text-[#00A86B]"><span className="w-2 h-2 rounded-full bg-[#00A86B]" />Из CRM (live)</span>
          </div>
        </div>
        <div className="divide-y divide-[#1a3a5c]">
          {STAGES.map((stage, i) => {
            const count = counts[stage.id] ?? 0;
            const nextCount = i < STAGES.length - 1 ? counts[STAGES[i + 1].id] ?? 0 : 0;
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const cr = i < STAGES.length - 1 ? convRate(count, nextCount) : "—";
            const isReal = (stage as { real?: boolean }).real;

            return (
              <div key={stage.id} className="px-4 py-3 flex items-center gap-4 hover:bg-[#0d2545] transition-colors">
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: stage.color + "33", border: `1px solid ${stage.color}` }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white flex items-center gap-1.5">
                      {stage.label}
                      {isReal && !loading && (
                        <span className="px-1 py-0.5 bg-[#00A86B]/15 border border-[#00A86B]/30 text-[#00A86B] text-[9px] rounded font-medium">live</span>
                      )}
                    </span>
                    <span className="text-sm font-bold" style={{ color: stage.color }}>
                      {loading && isReal ? "…" : count.toLocaleString()}
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
                  <div className="text-xs font-medium w-12 text-right flex-shrink-0"
                    style={{ color: parseFloat(cr) < 10 ? "#e74c3c" : "#00A86B" }}>
                    {cr}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Real breakdown by vertical + country */}
      {real && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* By vertical */}
          <div className="bg-[#0B1F3A] border border-[#1a3a5c] rounded-2xl p-4">
            <p className="text-xs text-[#8899aa] font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
              Вертикали
              <span className="px-1.5 py-0.5 bg-[#00A86B]/15 border border-[#00A86B]/30 text-[#00A86B] text-[9px] rounded font-medium">live CRM</span>
            </p>
            <div className="flex flex-col gap-2">
              {Object.entries(real.by_vertical)
                .sort(([, a], [, b]) => b - a)
                .map(([v, n]) => (
                  <div key={v} className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#071829] rounded-full overflow-hidden">
                      <div className="h-full bg-[#00A86B] rounded-full"
                        style={{ width: `${Math.max(4, (n / real.lead_created) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-white w-5 text-right font-bold">{n}</span>
                    <span className="text-[10px] text-[#8899aa] w-28 truncate">{VERTICAL_LABELS[v] ?? v}</span>
                  </div>
                ))}
              {Object.keys(real.by_vertical).length === 0 && (
                <p className="text-[#556677] text-xs">Нет данных — вертикаль не передаётся в лидах</p>
              )}
            </div>
          </div>

          {/* By country */}
          <div className="bg-[#0B1F3A] border border-[#1a3a5c] rounded-2xl p-4">
            <p className="text-xs text-[#8899aa] font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
              По стране
              <span className="px-1.5 py-0.5 bg-[#00A86B]/15 border border-[#00A86B]/30 text-[#00A86B] text-[9px] rounded font-medium">live CRM</span>
            </p>
            <div className="flex flex-col gap-3">
              {Object.entries(real.by_country)
                .sort(([, a], [, b]) => b - a)
                .map(([c, n]) => (
                  <div key={c} className="flex items-center gap-3">
                    <span className="text-lg">{c === "KZ" ? "🇰🇿" : c === "RU" ? "🇷🇺" : "🌍"}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-white font-medium">{c}</span>
                        <span className="text-[#00A86B] font-bold">{n}</span>
                      </div>
                      <div className="h-1.5 bg-[#071829] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00cba8] rounded-full"
                          style={{ width: `${Math.max(4, (n / real.lead_created) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              {Object.keys(real.by_country).length === 0 && (
                <p className="text-[#556677] text-xs">Нет данных — country не передаётся в лидах</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drop-off analysis + deployed */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0B1F3A] border border-[#e74c3c]/20 rounded-2xl p-4">
          <p className="text-xs text-[#e74c3c] font-semibold uppercase tracking-wider mb-3">Главные потери</p>
          <div className="flex flex-col gap-2">
            {[
              { stage: "Трафик → Страница", loss: "~90%", note: "Bounce, нет sticky CTA" },
              { stage: "CTA → Калькулятор", loss: "~30%", note: "Нет повторных CTA" },
              { stage: "Расчёт → Заявка",   loss: "~50%", note: "Нет follow-up" },
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
              "/white-import sticky CTA",
              "/kz/auto-parts vertical ctx",
              "/kz/auto-accessories vertical ctx",
              "/import/[category] vertical ctx",
              "service_cta_view/click events",
              "CRM: vertical + landing_page + calculator_used",
              "Funnel dashboard с live данными",
            ].map(label => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[#00A86B]">✓</span>
                <span className="text-xs text-white">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GA4 events reference */}
      <div className="bg-[#0B1F3A] border border-[#1a3a5c] rounded-2xl p-4">
        <p className="text-xs text-[#8899aa] font-medium uppercase tracking-wider mb-3">События GA4 для отслеживания</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {["service_cta_view", "service_cta_click", "delivery_request_start", "delivery_request_submit", "sticky_cta_click", "calculator_start", "calc_done", "high_intent_visitor"].map(ev => (
            <span key={ev} className="px-2 py-1 bg-[#071829] border border-[#1a3a5c] rounded-lg text-[10px] font-mono text-[#8899aa]">{ev}</span>
          ))}
        </div>
        <p className="text-[#556677] text-xs">
          Нижняя воронка (лид_создан → сделка) — реальные данные из Neon CRM.
          Верхняя воронка (трафик → калькулятор) — оценочные данные. Подключите GA4 Data API для live верхнего фрейма.
        </p>
      </div>
    </div>
  );
}
