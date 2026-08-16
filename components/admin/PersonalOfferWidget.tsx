"use client";

import { useState } from "react";

export function PersonalOfferWidget({ leadId }: { leadId: number }) {
  const [loading, setLoading] = useState(false);
  const [offer, setOffer] = useState("");
  const [subject, setSubject] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [websiteAnalyzed, setWebsiteAnalyzed] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loadingStep, setLoadingStep] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    setOffer("");
    setWebsiteAnalyzed(false);
    setLoadingStep("Загружаю данные лида...");

    // Simulate steps for UX feedback
    const stepTimer = setTimeout(() => setLoadingStep("Анализирую сайт компании..."), 1200);

    try {
      const res = await fetch(`/api/admin/leads/${leadId}/offer`, { method: "POST" });
      clearTimeout(stepTimer);
      const data = await res.json();
      if (data.ok) {
        setOffer(data.offer ?? "");
        setSubject(data.subject ?? "");
        setWebsiteAnalyzed(data.website_analyzed ?? false);
        setWebsiteUrl(data.website_url ?? "");
      } else {
        setError(data.error ?? "Ошибка генерации");
      }
    } catch {
      clearTimeout(stepTimer);
      setError("Ошибка сети");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(offer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">🤖 Персональный оффер</h3>
        {offer && (
          <button
            onClick={copy}
            className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition"
          >
            {copied ? "✓ Скопировано" : "Копировать"}
          </button>
        )}
      </div>

      {!offer && !loading && (
        <p className="text-xs text-slate-500">
          AI зайдёт на сайт компании, проанализирует бизнес и сгенерирует индивидуальное КП.
        </p>
      )}

      {websiteAnalyzed && websiteUrl && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-lg px-3 py-1.5">
          <span>✓</span>
          <span>Сайт проанализирован:</span>
          <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="underline opacity-80 hover:opacity-100 truncate max-w-[200px]">
            {websiteUrl.replace(/^https?:\/\//, "")}
          </a>
        </div>
      )}

      {subject && (
        <div className="text-xs text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2">
          <span className="text-slate-400 font-medium">Тема: </span>{subject}
        </div>
      )}

      {offer && (
        <textarea
          value={offer}
          onChange={e => setOffer(e.target.value)}
          rows={9}
          className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500 resize-y leading-relaxed"
        />
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <button
        onClick={generate}
        disabled={loading}
        className="w-full py-2.5 rounded-lg text-sm font-semibold transition bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {loadingStep || "Генерирую..."}
          </>
        ) : offer ? "Перегенерировать" : "Сгенерировать оффер"}
      </button>
    </div>
  );
}
