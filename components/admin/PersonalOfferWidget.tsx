"use client";

import { useState } from "react";

interface ContactsFound {
  phones: string[];
  emails: string[];
  telegram: string | null;
  whatsapp: string | null;
  instagram: string | null;
  address: string | null;
}

interface OfferResult {
  offer: string;
  subject: string;
  business_summary: string;
  product_categories: string[];
  pain_points: string[];
  pain_analysis: string;
  website_analyzed: boolean;
  website_url: string | null;
  contacts_found: ContactsFound;
}

const LOADING_STEPS = [
  "Захожу на сайт компании...",
  "Анализирую страницу контактов...",
  "Извлекаю контакты и товары...",
  "Выявляю боли бизнеса...",
  "Пишу персональное КП...",
];

export function PersonalOfferWidget({ leadId }: { leadId: number }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OfferResult | null>(null);
  const [copied, setCopied] = useState<"offer" | "subject" | null>(null);
  const [error, setError] = useState("");
  const [stepIdx, setStepIdx] = useState(0);

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
        setResult(data as OfferResult);
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

  async function copy(text: string, key: "offer" | "subject") {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const hasContacts = result && (
    result.contacts_found.phones.length > 0 ||
    result.contacts_found.emails.length > 0 ||
    result.contacts_found.telegram ||
    result.contacts_found.whatsapp
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">🤖 AI-анализ и КП</h3>
        {result?.website_analyzed && (
          <span className="text-xs bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 px-2 py-0.5 rounded-full">
            ✓ сайт проанализирован
          </span>
        )}
      </div>

      {/* Empty state */}
      {!result && !loading && (
        <p className="text-xs text-slate-500 leading-relaxed">
          AI зайдёт на сайт компании, найдёт контакты, выявит боли бизнеса и напишет персональное КП под их конкретную ситуацию.
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

      {/* Contacts found */}
      {hasContacts && result && (
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
              <a href={result.contacts_found.telegram} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                {result.contacts_found.telegram.replace("https://t.me/", "@")}
              </a>
            </div>
          )}
          {result.contacts_found.whatsapp && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">WhatsApp:</span>
              <a href={result.contacts_found.whatsapp} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300">
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

      {/* Business analysis */}
      {result?.business_summary && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 space-y-2.5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">📊 Анализ бизнеса</p>

          {result.business_summary && (
            <p className="text-xs text-slate-300 leading-relaxed">{result.business_summary}</p>
          )}

          {result.product_categories?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.product_categories.map(cat => (
                <span key={cat} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{cat}</span>
              ))}
            </div>
          )}

          {result.pain_points?.length > 0 && (
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

      {/* Subject */}
      {result?.subject && (
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
          <span className="text-xs text-slate-500 shrink-0">Тема:</span>
          <span className="text-xs text-slate-300 flex-1">{result.subject}</span>
          <button
            onClick={() => copy(result.subject, "subject")}
            className="text-xs text-slate-500 hover:text-slate-300 transition shrink-0"
          >
            {copied === "subject" ? "✓" : "копировать"}
          </button>
        </div>
      )}

      {/* Offer text */}
      {result?.offer && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">✉️ Текст КП</p>
            <button
              onClick={() => copy(result.offer, "offer")}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition"
            >
              {copied === "offer" ? "✓ Скопировано" : "Копировать"}
            </button>
          </div>
          <textarea
            value={result.offer}
            onChange={e => setResult(r => r ? { ...r, offer: e.target.value } : r)}
            rows={10}
            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500 resize-y leading-relaxed"
          />
        </div>
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
        ) : result ? "Перегенерировать" : "Анализировать и сгенерировать КП"}
      </button>
    </div>
  );
}
