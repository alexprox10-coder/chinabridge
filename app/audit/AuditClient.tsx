"use client";

import { useState } from "react";

interface Insight {
  type: "success" | "warning" | "opportunity";
  text: string;
}

interface AuditResult {
  companyName: string;
  businessType: string;
  categories: string[];
  marketplaces: string[];
  optimizationScore: number;
  intermediaryProbability: number;
  costReductionPotential: string;
  seoOpportunities: number;
  chinaSourceable: number;
  totalCategories: number;
  insights: Insight[];
  recommendations: string[];
  summary: string;
}

const MARKETPLACE_LABEL: Record<string, string> = {
  wb: "Wildberries", ozon: "Ozon", kaspi: "Kaspi",
  amazon: "Amazon", aliexpress: "AliExpress",
};

const STEPS = [
  "Загружаем сайт...",
  "Анализируем ассортимент...",
  "Ищем возможности в Китае...",
  "Считаем потенциал оптимизации...",
  "Готовим отчёт...",
];

function GaugeScore({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 8 ? "#22c55e" : score >= 6 ? "#f59e0b" : "#3b82f6";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 120 60" className="w-full h-full">
          <path d="M10 58 A50 50 0 0 1 110 58" fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round"/>
          <path
            d="M10 58 A50 50 0 0 1 110 58"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${pct * 1.57} 157`}
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="text-2xl font-black text-white">{score.toFixed(1)}</span>
        </div>
      </div>
      <span className="text-slate-400 text-xs">из 10</span>
    </div>
  );
}

function InsightIcon({ type }: { type: string }) {
  if (type === "success") return <span className="text-green-400">✅</span>;
  if (type === "warning") return <span className="text-amber-400">⚠️</span>;
  return <span className="text-blue-400">💡</span>;
}

export default function AuditClient() {
  const [url,      setUrl]      = useState("");
  const [step,     setStep]     = useState<"form" | "loading" | "result" | "contact">("form");
  const [stepIdx,  setStepIdx]  = useState(0);
  const [result,   setResult]   = useState<AuditResult | null>(null);
  const [error,    setError]    = useState("");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [sent,     setSent]     = useState(false);

  async function runAudit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setError(""); setStep("loading"); setStepIdx(0);

    const timer = setInterval(() => setStepIdx(i => Math.min(i + 1, STEPS.length - 1)), 2200);

    try {
      const r = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const d = await r.json();
      clearInterval(timer);
      if (d.ok) { setResult(d.audit); setStep("result"); }
      else { setError("Не удалось проанализировать сайт. Проверьте URL."); setStep("form"); }
    } catch {
      clearInterval(timer);
      setError("Ошибка сети. Попробуйте ещё раз.");
      setStep("form");
    }
  }

  async function sendContact(e: React.FormEvent) {
    e.preventDefault();
    if (!email && !phone) return;
    try {
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, name, email, phone }),
      });
    } catch {}
    setSent(true);
  }

  // ── FORM ──────────────────────────────────────────────────────────────────
  if (step === "form") return (
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-full text-[#00A86B] text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse" />
          AI Business Audit — бесплатно
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
          Узнайте потенциал<br />
          <span className="text-[#00A86B]">вашего импорта</span> за 60 секунд
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mb-10">
          AI анализирует ваш бизнес, находит категории товаров из Китая
          и считает потенциальную экономию. Бесплатно.
        </p>

        <form onSubmit={runAudit} className="w-full max-w-xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="yourshop.ru или https://yourshop.ru"
              className="flex-1 px-4 py-3.5 bg-slate-900 border border-slate-700 focus:border-[#00A86B] rounded-xl text-white placeholder-slate-500 outline-none text-sm transition"
              required
            />
            <button
              type="submit"
              className="px-6 py-3.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-bold rounded-xl text-sm transition whitespace-nowrap"
            >
              Запустить аудит →
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </form>

        {/* Примеры */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {["myshop.ru", "seller.wildberries.ru", "example.com"].map(ex => (
            <button key={ex} onClick={() => setUrl(ex)}
              className="text-xs text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-600 px-3 py-1 rounded-full transition">
              {ex}
            </button>
          ))}
        </div>
      </section>

      {/* Что анализирует AI */}
      <section className="max-w-4xl mx-auto px-4 pb-20 w-full">
        <p className="text-slate-600 text-xs uppercase tracking-widest text-center mb-6">Что анализирует AI</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: "🛍️", label: "Ассортимент", desc: "Категории товаров" },
            { icon: "🏭", label: "Поставщики", desc: "Прямые vs посредники" },
            { icon: "💰", label: "Экономика", desc: "Потенциал снижения с/с" },
            { icon: "📈", label: "SEO", desc: "Новые ключевые запросы" },
          ].map(c => (
            <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <span className="text-2xl">{c.icon}</span>
              <p className="text-white text-sm font-semibold mt-2">{c.label}</p>
              <p className="text-slate-500 text-xs mt-0.5">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (step === "loading") return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-[#00A86B]/30 border-t-[#00A86B] animate-spin" />
        <h2 className="text-white font-bold text-xl mb-2">AI анализирует сайт</h2>
        <p className="text-[#00A86B] text-sm font-medium mb-8">{STEPS[stepIdx]}</p>
        <div className="space-y-2">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex items-center gap-3 text-sm text-left ${i <= stepIdx ? "text-slate-300" : "text-slate-700"}`}>
              <span className="text-base">{i < stepIdx ? "✅" : i === stepIdx ? "⏳" : "○"}</span>
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (step === "result" && result) return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-700/40 rounded-full text-green-400 text-xs font-medium mb-4">
            ✅ Аудит завершён
          </div>
          <h1 className="text-2xl font-black text-white">
            ChinaBridge AI Audit — {result.companyName}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{result.businessType}</p>
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 col-span-2 lg:col-span-1 flex flex-col items-center">
            <p className="text-slate-500 text-xs mb-3">Потенциал оптимизации</p>
            <GaugeScore score={result.optimizationScore} />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
            <p className="text-slate-500 text-xs mb-1">Работа через посредников</p>
            <p className="text-3xl font-black text-amber-400">{result.intermediaryProbability}%</p>
            <p className="text-slate-600 text-xs mt-1">вероятность</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
            <p className="text-slate-500 text-xs mb-1">Снижение себестоимости</p>
            <p className="text-3xl font-black text-green-400">{result.costReductionPotential}%</p>
            <p className="text-slate-600 text-xs mt-1">при прямых закупках</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
            <p className="text-slate-500 text-xs mb-1">SEO-возможностей</p>
            <p className="text-3xl font-black text-blue-400">{result.seoOpportunities}</p>
            <p className="text-slate-600 text-xs mt-1">новых запросов</p>
          </div>
        </div>

        {/* Categories & Marketplaces */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Товарные категории</p>
            <div className="flex flex-wrap gap-2">
              {result.categories.map(c => (
                <span key={c} className="text-xs px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-full">{c}</span>
              ))}
            </div>
            <p className="text-slate-500 text-xs mt-3">
              {result.chinaSourceable} из {result.totalCategories} можно закупать напрямую в Китае
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Маркетплейсы</p>
            {result.marketplaces.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.marketplaces.map(m => (
                  <span key={m} className="text-xs px-3 py-1 bg-violet-900/40 border border-violet-700/50 text-violet-300 rounded-full">
                    {MARKETPLACE_LABEL[m] ?? m}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-sm">Маркетплейсы не обнаружены</p>
            )}
            <p className="text-slate-500 text-xs mt-3">{result.summary}</p>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-4">Что нашёл AI</p>
          <div className="space-y-3">
            {result.insights.map((ins, i) => (
              <div key={i} className={`flex gap-3 p-3 rounded-lg border ${
                ins.type === "success" ? "bg-green-900/10 border-green-800/30" :
                ins.type === "warning" ? "bg-amber-900/10 border-amber-800/30" :
                "bg-blue-900/10 border-blue-800/30"
              }`}>
                <InsightIcon type={ins.type} />
                <p className="text-slate-300 text-sm">{ins.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-4">Рекомендации</p>
          <div className="space-y-3">
            {result.recommendations.map((r, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-[#00A86B]/20 text-[#00A86B] text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-slate-300 text-sm">{r}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-[#00A86B]/20 to-slate-900 border border-[#00A86B]/30 rounded-2xl p-6 text-center">
          <h3 className="text-white font-black text-xl mb-2">
            Получите персональный план оптимизации
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            Наш AI подготовит полный отчёт с конкретными товарами, поставщиками и расчётом ROI
          </p>
          <button
            onClick={() => setStep("contact")}
            className="px-8 py-3.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-bold rounded-xl transition"
          >
            Получить полный отчёт →
          </button>
          <p className="text-slate-600 text-xs mt-3">Бесплатно · Ответим в течение 2 часов</p>
        </div>

        <button
          onClick={() => { setStep("form"); setResult(null); setUrl(""); }}
          className="w-full text-slate-600 text-sm hover:text-slate-400 transition"
        >
          ← Проверить другой сайт
        </button>
      </div>
    </div>
  );

  // ── CONTACT ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-white font-black text-2xl mb-2">Заявка принята!</h2>
            <p className="text-slate-400">Свяжемся с вами в течение 2 часов с полным отчётом и персональным планом.</p>
            <a href="https://t.me/chinabridge" target="_blank" rel="noopener noreferrer"
              className="inline-block mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition">
              Написать в Telegram →
            </a>
          </div>
        ) : (
          <>
            <button onClick={() => setStep("result")} className="text-slate-500 text-sm mb-6 hover:text-slate-300 transition">← Назад к аудиту</button>
            <h2 className="text-white font-black text-2xl mb-1">Персональный план для {result?.companyName}</h2>
            <p className="text-slate-500 text-sm mb-6">Оставьте контакты — пришлём полный отчёт бесплатно</p>
            <form onSubmit={sendContact} className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 focus:border-[#00A86B] rounded-xl text-white placeholder-slate-500 outline-none text-sm transition" />
              <input value={email} onChange={e => setEmail(e.target.value)}
                type="email" placeholder="Email"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 focus:border-[#00A86B] rounded-xl text-white placeholder-slate-500 outline-none text-sm transition" />
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="Телефон или Telegram"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 focus:border-[#00A86B] rounded-xl text-white placeholder-slate-500 outline-none text-sm transition" />
              <button type="submit"
                className="w-full py-3.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-bold rounded-xl text-sm transition">
                Получить полный отчёт →
              </button>
              <p className="text-slate-600 text-xs text-center">Без спама. Ответим лично.</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
