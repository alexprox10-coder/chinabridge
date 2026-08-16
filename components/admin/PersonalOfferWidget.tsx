"use client";

import { useState } from "react";

interface ScoreFactor {
  label: string;
  points: number;
}

interface OfferOption {
  title: string;
  description: string;
}

interface AttackPlan {
  response_probability: number;
  deal_probability: number;
  what_to_sell: string;
  main_pain: string;
  first_contact: string;
  second_contact: string;
  best_contact: string;
  dont_do: string;
  first_goal: string;
}

interface ContactsFound {
  phones: string[];
  emails: string[];
  telegram: string | null;
  whatsapp: string | null;
  instagram: string | null;
  address: string | null;
}

interface CockpitResult {
  lead_score: number;
  score_level: "HOT" | "WARM" | "COLD";
  score_factors: ScoreFactor[];
  deal_potential_min: number;
  deal_potential_max: number;
  business_summary: string;
  product_categories: string[];
  pain_points: string[];
  pain_analysis: string;
  selected_product: string;
  product_reason: string;
  offer_options: OfferOption[];
  attack_plan: AttackPlan | null;
  call_script: string;
  message_short: string;
  offer: string;
  subject: string;
  website_analyzed: boolean;
  website_url: string | null;
  contacts_found: ContactsFound;
}

const LOADING_STEPS = [
  "Захожу на сайт компании...",
  "Анализирую страницу контактов...",
  "Извлекаю контакты и товары...",
  "Выявляю боли бизнеса...",
  "Формирую AI Sales Cockpit...",
];

function ProbabilityBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={`font-bold ${color}`}>{value}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            value >= 60 ? "bg-emerald-500" : value >= 35 ? "bg-amber-500" : "bg-slate-500"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function CopyButton({ text, label = "Копировать" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition shrink-0"
    >
      {copied ? "✓ Скопировано" : label}
    </button>
  );
}

export function PersonalOfferWidget({ leadId }: { leadId: number }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CockpitResult | null>(null);
  const [error, setError] = useState("");
  const [stepIdx, setStepIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"short" | "full">("short");
  const [scriptOpen, setScriptOpen] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    setResult(null);
    setStepIdx(0);

    const interval = setInterval(() => {
      setStepIdx(i => Math.min(i + 1, LOADING_STEPS.length - 1));
    }, 2000);

    try {
      const res = await fetch(`/api/admin/leads/${leadId}/offer`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setResult(data as CockpitResult);
      } else {
        setError(data.error ?? "Ошибка генерации");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      clearInterval(interval);
      setLoading(false);
      setStepIdx(0);
    }
  }

  const scoreColors = {
    HOT: { bg: "bg-red-500/20", border: "border-red-700/50", text: "text-red-400", bar: "bg-red-500", badge: "bg-red-600" },
    WARM: { bg: "bg-amber-500/20", border: "border-amber-700/50", text: "text-amber-400", bar: "bg-amber-500", badge: "bg-amber-600" },
    COLD: { bg: "bg-blue-500/20", border: "border-blue-700/50", text: "text-blue-400", bar: "bg-blue-500", badge: "bg-blue-700" },
  };

  const hasContacts = result && (
    result.contacts_found.phones.length > 0 ||
    result.contacts_found.emails.length > 0 ||
    result.contacts_found.telegram ||
    result.contacts_found.whatsapp
  );

  const sc = result ? scoreColors[result.score_level] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">🎯 AI Sales Cockpit</h3>
        {result?.website_analyzed && (
          <span className="text-xs bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 px-2 py-0.5 rounded-full">
            ✓ сайт проанализирован
          </span>
        )}
      </div>

      {/* Empty state */}
      {!result && !loading && (
        <p className="text-xs text-slate-500 leading-relaxed">
          AI зайдёт на сайт, найдёт контакты, оценит лид по 100-балльной шкале, выявит боли, подберёт продукт и напишет скрипт звонка, сообщение и КП.
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-blue-400">
            <span className="w-3.5 h-3.5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin flex-shrink-0" />
            <span>{LOADING_STEPS[stepIdx]}</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-1000"
              style={{ width: `${((stepIdx + 1) / LOADING_STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {result && sc && (
        <>
          {/* ── Секция 1: Lead Score ── */}
          <div className={`${sc.bg} border ${sc.border} rounded-xl p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-black ${sc.text}`}>{result.lead_score}</span>
                <div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${sc.badge}`}>
                    {result.score_level}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">из 100 баллов</p>
                </div>
              </div>
              <div className="w-24">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${sc.bar}`}
                    style={{ width: `${result.lead_score}%` }}
                  />
                </div>
              </div>
            </div>

            {result.score_factors.length > 0 && (
              <div className="space-y-1 border-t border-slate-700/50 pt-2">
                {result.score_factors.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{f.label}</span>
                    <span className={f.points >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {f.points >= 0 ? "+" : ""}{f.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Секция 2: Deal Potential ── */}
          {(result.deal_potential_min > 0 || result.deal_potential_max > 0) && (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Потенциал сделки</p>
                <p className="text-lg font-bold text-white mt-0.5">
                  ${result.deal_potential_min.toLocaleString()} — ${result.deal_potential_max.toLocaleString()}
                </p>
              </div>
              <span className="text-xs text-slate-600 text-right max-w-[120px] leading-tight">предварительная оценка AI</span>
            </div>
          )}

          {/* ── Секция 3: Контакты с сайта ── */}
          {hasContacts && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">📞 Контакты с сайта</p>
              {result.contacts_found.phones.map(p => (
                <div key={p} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Тел:</span>
                  <a href={`tel:${p}`} className="text-blue-400 hover:text-blue-300">{p}</a>
                </div>
              ))}
              {result.contacts_found.emails.map(e => (
                <div key={e} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Email:</span>
                  <a href={`mailto:${e}`} className="text-blue-400 hover:text-blue-300">{e}</a>
                </div>
              ))}
              {result.contacts_found.telegram && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Telegram:</span>
                  <a href={result.contacts_found.telegram} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300">
                    {result.contacts_found.telegram.replace("https://t.me/", "@")}
                  </a>
                </div>
              )}
              {result.contacts_found.whatsapp && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">WhatsApp:</span>
                  <a href={result.contacts_found.whatsapp} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
                    {result.contacts_found.whatsapp.replace("https://wa.me/", "+")}
                  </a>
                </div>
              )}
              {result.contacts_found.address && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-slate-500 shrink-0">Адрес:</span>
                  <span className="text-slate-300">{result.contacts_found.address}</span>
                </div>
              )}
            </div>
          )}

          {/* ── Секция 4: Анализ бизнеса ── */}
          {result.business_summary && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 space-y-2.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">📊 Анализ бизнеса</p>

              <p className="text-xs text-slate-300 leading-relaxed">{result.business_summary}</p>

              {result.product_categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.product_categories.map(cat => (
                    <span key={cat} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{cat}</span>
                  ))}
                </div>
              )}

              {result.pain_points.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-orange-400">🎯 Выявленные боли:</p>
                  {result.pain_points.map((pain, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                      <span className="text-orange-500 mt-0.5 shrink-0">•</span>
                      <span>{pain}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.pain_analysis && (
                <p className="text-xs text-slate-400 italic leading-relaxed border-t border-slate-700 pt-2">
                  {result.pain_analysis}
                </p>
              )}
            </div>
          )}

          {/* ── Секция 5: Выбранный продукт ── */}
          {result.selected_product && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">📦 Продукт ChinaBridge</p>
              <p className="text-base font-bold text-white">{result.selected_product}</p>
              {result.product_reason && (
                <p className="text-xs text-slate-400 leading-relaxed">{result.product_reason}</p>
              )}

              {result.offer_options.length > 0 && (
                <div className="space-y-2 border-t border-slate-700/50 pt-3">
                  <p className="text-xs font-medium text-slate-400">Варианты оффера:</p>
                  {result.offer_options.map((opt, i) => (
                    <div key={i} className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-2.5 space-y-1">
                      <p className="text-xs font-semibold text-slate-200">{opt.title}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{opt.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Секция 6: Attack Plan ── */}
          {result.attack_plan && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">⚔️ План атаки</p>

              <div className="space-y-2">
                <ProbabilityBar
                  value={result.attack_plan.response_probability}
                  label="Вероятность ответа"
                  color={result.attack_plan.response_probability >= 60 ? "text-emerald-400" : result.attack_plan.response_probability >= 35 ? "text-amber-400" : "text-slate-400"}
                />
                <ProbabilityBar
                  value={result.attack_plan.deal_probability}
                  label="Вероятность сделки"
                  color={result.attack_plan.deal_probability >= 60 ? "text-emerald-400" : result.attack_plan.deal_probability >= 35 ? "text-amber-400" : "text-slate-400"}
                />
              </div>

              <div className="grid grid-cols-1 gap-1.5 border-t border-slate-700/50 pt-2">
                {[
                  { label: "Что продаём", value: result.attack_plan.what_to_sell },
                  { label: "Главная боль", value: result.attack_plan.main_pain },
                  { label: "1-й канал", value: result.attack_plan.first_contact },
                  { label: "2-й канал", value: result.attack_plan.second_contact },
                  { label: "Лучший контакт", value: result.attack_plan.best_contact },
                  { label: "Цель контакта", value: result.attack_plan.first_goal },
                  { label: "❌ Не делать", value: result.attack_plan.dont_do },
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-2 text-xs">
                    <span className="text-slate-500 shrink-0 w-28">{row.label}:</span>
                    <span className="text-slate-300 leading-snug">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Секция 7: Следующее действие ── */}
          {result.attack_plan && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">🚀 Следующий шаг</p>

              {/* CTA кнопка */}
              <div className="flex gap-2 flex-wrap">
                {result.contacts_found.phones.length > 0 && (result.attack_plan.first_contact === "Телефон" || result.attack_plan.first_contact === "WhatsApp") && (
                  <a
                    href={result.attack_plan.first_contact === "WhatsApp" && result.contacts_found.whatsapp
                      ? result.contacts_found.whatsapp
                      : `tel:${result.contacts_found.phones[0]}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition"
                  >
                    {result.attack_plan.first_contact === "WhatsApp" ? "💬 WhatsApp" : "📞 Позвонить"}
                    <span className="font-normal opacity-80">
                      {result.contacts_found.phones[0]}
                    </span>
                  </a>
                )}
                {result.contacts_found.emails.length > 0 && result.attack_plan.first_contact === "Email" && (
                  <a
                    href={`mailto:${result.contacts_found.emails[0]}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition"
                  >
                    ✉️ Email
                    <span className="font-normal opacity-80">{result.contacts_found.emails[0]}</span>
                  </a>
                )}
              </div>

              {/* Скрипт звонка */}
              {result.call_script && (
                <div className="border border-slate-700/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setScriptOpen(o => !o)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700/40 transition"
                  >
                    <span>📋 Скрипт звонка</span>
                    <span className="text-slate-500">{scriptOpen ? "▲" : "▼"}</span>
                  </button>
                  {scriptOpen && (
                    <div className="px-3 pb-3 pt-1 space-y-2">
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{result.call_script}</p>
                      <CopyButton text={result.call_script} label="Копировать скрипт" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Секция 8: Три уровня КП ── */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">✉️ Коммерческие предложения</p>

            {/* Тема письма */}
            {result.subject && (
              <div className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-500 shrink-0">Тема:</span>
                <span className="text-xs text-slate-300 flex-1">{result.subject}</span>
                <CopyButton text={result.subject} />
              </div>
            )}

            {/* Табы */}
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("short")}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${activeTab === "short" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200 border border-slate-700"}`}
              >
                Короткое
              </button>
              <button
                onClick={() => setActiveTab("full")}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${activeTab === "full" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200 border border-slate-700"}`}
              >
                Полное КП
              </button>
            </div>

            {activeTab === "short" && result.message_short && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Первое сообщение — отправить до звонка или если не взяли трубку</p>
                <textarea
                  value={result.message_short}
                  onChange={e => setResult(r => r ? { ...r, message_short: e.target.value } : r)}
                  rows={5}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 resize-y leading-relaxed"
                />
                <CopyButton text={result.message_short} label="Копировать сообщение" />
              </div>
            )}

            {activeTab === "full" && result.offer && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Полное КП — отправить после проявления интереса</p>
                <textarea
                  value={result.offer}
                  onChange={e => setResult(r => r ? { ...r, offer: e.target.value } : r)}
                  rows={10}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500 resize-y leading-relaxed"
                />
                <CopyButton text={result.offer} label="Копировать КП" />
              </div>
            )}
          </div>
        </>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={generate}
        disabled={loading}
        className="w-full py-2.5 rounded-lg text-sm font-semibold transition bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Анализирую...
          </>
        ) : result ? "🔄 Обновить анализ" : "🎯 Запустить AI Sales Анализ"}
      </button>
    </div>
  );
}
