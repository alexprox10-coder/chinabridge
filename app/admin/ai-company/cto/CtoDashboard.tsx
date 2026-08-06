"use client";
import { useState } from "react";
import type { CtoReport, CheckSection, CheckResult, CheckStatus } from "@/lib/ai-cto/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 90) return "text-emerald-400";
  if (score >= 70) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(score: number) {
  if (score >= 90) return "from-emerald-900/20 border-emerald-700/40";
  if (score >= 70) return "from-amber-900/20 border-amber-700/40";
  return "from-red-900/20 border-red-700/40";
}

function statusDot(status: CheckStatus) {
  if (status === "OK")      return "bg-emerald-400";
  if (status === "WARNING") return "bg-amber-400 animate-pulse";
  if (status === "ERROR")   return "bg-red-400 animate-pulse";
  return "bg-slate-500";
}

function statusBadge(status: CheckStatus) {
  if (status === "OK")      return "bg-emerald-900/40 text-emerald-300 border-emerald-700";
  if (status === "WARNING") return "bg-amber-900/40 text-amber-300 border-amber-700";
  if (status === "ERROR")   return "bg-red-900/40 text-red-300 border-red-700";
  return "bg-slate-800 text-slate-400 border-slate-700";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckRow({ c }: { c: CheckResult }) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-slate-800/50 last:border-0 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${statusDot(c.status)}`} />
        <span className="text-slate-300 text-xs truncate">{c.name}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {c.ms != null && <span className="text-slate-500 text-xs">{c.ms}ms</span>}
        <span className={`text-xs px-1.5 py-0.5 rounded border ${statusBadge(c.status)}`}>{c.status}</span>
      </div>
      {c.message && <span className="text-slate-500 text-xs w-full truncate">{c.message}</span>}
    </div>
  );
}

function SectionCard({ s }: { s: CheckSection }) {
  const [open, setOpen] = useState(s.status !== "OK");
  return (
    <div className={`bg-gradient-to-b ${scoreBg(s.score)} to-transparent border rounded-xl p-4`}>
      <button className="w-full flex items-center justify-between gap-2" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{s.icon}</span>
          <span className="text-white font-medium text-sm">{s.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${scoreColor(s.score)}`}>{s.score}/100</span>
          <span className={`text-xs px-1.5 py-0.5 rounded border ${statusBadge(s.status)}`}>{s.status}</span>
          <span className="text-slate-500 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div className="mt-3">
          {s.checks.map((c, i) => <CheckRow key={i} c={c} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface FixResult { id: string; label: string; status: "fixed" | "skipped" | "error"; detail?: string; }

export default function CtoDashboard({ initialReport }: { initialReport: CtoReport | null }) {
  const [report, setReport]     = useState<CtoReport | null>(initialReport);
  const [running, setRunning]   = useState(false);
  const [fixing, setFixing]     = useState(false);
  const [fixResult, setFixResult] = useState<{ fixes: FixResult[]; summary: { fixed: number; errors: number; skipped: number } } | null>(null);
  const [history, setHistory]   = useState<CtoReport[]>([]);
  const [showHist, setShowHist] = useState(false);
  const [tab, setTab]           = useState<"overview" | "sections" | "issues" | "recommendations">("overview");
  const [error, setError]       = useState<string | null>(null);

  async function runAudit() {
    setRunning(true);
    setError(null);
    try {
      const res  = await fetch("/api/ai-cto/run", { method: "POST" });
      const data = await res.json() as { ok: boolean; report?: CtoReport; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Ошибка запуска");
      if (data.report) setReport(data.report);
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  }

  async function runFix() {
    setFixing(true);
    setFixResult(null);
    setError(null);
    try {
      const res  = await fetch("/api/ai-cto/fix", { method: "POST" });
      const data = await res.json() as { ok: boolean; fixes?: FixResult[]; summary?: { fixed: number; errors: number; skipped: number }; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Ошибка");
      setFixResult({ fixes: data.fixes ?? [], summary: data.summary ?? { fixed: 0, errors: 0, skipped: 0 } });
    } catch (e) {
      setError(String(e));
    } finally {
      setFixing(false);
    }
  }

  async function loadHistory() {
    const res  = await fetch("/api/ai-cto/reports?history=1");
    const data = await res.json() as { ok: boolean; reports?: CtoReport[] };
    if (data.ok && data.reports) setHistory(data.reports);
    setShowHist(true);
  }

  async function loadReport(id: number) {
    const res  = await fetch(`/api/ai-cto/reports?id=${id}`);
    const data = await res.json() as { ok: boolean; report?: CtoReport };
    if (data.ok && data.report) { setReport(data.report); setShowHist(false); }
  }

  const TABS = [
    { id: "overview",        label: "Сводка",         icon: "📊" },
    { id: "sections",        label: "Модули",          icon: "🔍" },
    { id: "issues",          label: "Проблемы",        icon: "⚠️" },
    { id: "recommendations", label: "Рекомендации",   icon: "💡" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">🤖 AI CTO</h1>
          <p className="text-slate-400 text-sm mt-0.5">Ежедневный аудит платформы — Chief Technology Officer</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={loadHistory}
            className="px-3 py-2 rounded-lg text-sm text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-white transition">
            📚 История
          </button>
          <button onClick={runFix} disabled={fixing || running}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition">
            {fixing ? "🔧 Исправляю..." : "🔧 Устранить ошибки"}
          </button>
          <button onClick={runAudit} disabled={running || fixing}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition">
            {running ? "⏳ Аудит идёт..." : "▶ Запустить аудит"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded-xl text-red-300 text-sm">{error}</div>
      )}

      {fixing && (
        <div className="p-6 bg-slate-900 border border-orange-700/40 rounded-2xl text-center">
          <div className="text-4xl mb-3 animate-spin inline-block">🔧</div>
          <p className="text-white font-semibold">AI CTO применяет исправления...</p>
          <p className="text-slate-400 text-sm mt-1">Очистка тестовых данных, проверка защиты роутов, применение security headers</p>
        </div>
      )}

      {fixResult && !fixing && (
        <div className="bg-slate-900 border border-orange-700/40 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-base">🔧 Результаты исправления</h3>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700">{fixResult.summary.fixed} исправлено</span>
              {fixResult.summary.errors > 0 && <span className="px-2 py-1 rounded bg-red-900/40 text-red-300 border border-red-700">{fixResult.summary.errors} ошибок</span>}
              <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">{fixResult.summary.skipped} пропущено</span>
            </div>
          </div>
          <div className="space-y-2">
            {fixResult.fixes.map(f => (
              <div key={f.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                f.status === "fixed"   ? "bg-emerald-900/10 border-emerald-700/40" :
                f.status === "error"   ? "bg-red-900/10 border-red-700/40" :
                "bg-slate-800/40 border-slate-700/40"
              }`}>
                <span className="text-base shrink-0 mt-0.5">
                  {f.status === "fixed" ? "✅" : f.status === "error" ? "❌" : "⏭"}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white">{f.label}</div>
                  {f.detail && <div className="text-xs text-slate-400 mt-0.5">{f.detail}</div>}
                </div>
              </div>
            ))}
          </div>
          {fixResult.summary.fixed > 0 && (
            <div className="mt-4 p-3 bg-amber-900/10 border border-amber-700/40 rounded-lg">
              <p className="text-amber-300 text-xs font-medium">⚡ Изменения кода применены локально. Для активации нужен задеплоить изменения.</p>
            </div>
          )}
          <button onClick={() => setFixResult(null)} className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition">✕ Закрыть</button>
        </div>
      )}

      {running && (
        <div className="p-6 bg-slate-900 border border-slate-700 rounded-2xl text-center">
          <div className="text-4xl mb-3 animate-spin inline-block">⚙️</div>
          <p className="text-white font-semibold">AI CTO проводит полный аудит платформы...</p>
          <p className="text-slate-400 text-sm mt-1">Это займёт 30–120 секунд</p>
        </div>
      )}

      {/* History modal */}
      {showHist && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">История отчётов</h3>
            <button onClick={() => setShowHist(false)} className="text-slate-500 hover:text-white text-sm">✕</button>
          </div>
          {history.length === 0
            ? <p className="text-slate-500 text-sm">Нет сохранённых отчётов</p>
            : history.map(r => (
              <button key={r.id} onClick={() => loadReport(r.id!)}
                className="w-full flex items-center justify-between py-2 border-b border-slate-800 last:border-0 hover:bg-slate-800/40 px-2 rounded transition">
                <span className="text-slate-400 text-sm">{fmtDate(r.runAt)}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${scoreColor(r.healthScore)}`}>{r.healthScore}/100</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${
                    r.systemStatus === "GREEN" ? "bg-emerald-900/40 text-emerald-300 border-emerald-700" :
                    r.systemStatus === "YELLOW" ? "bg-amber-900/40 text-amber-300 border-amber-700" :
                    "bg-red-900/40 text-red-300 border-red-700"
                  }`}>{r.systemStatus}</span>
                </div>
              </button>
            ))
          }
        </div>
      )}

      {!report && !running && (
        <div className="p-12 bg-slate-900 border border-slate-700 border-dashed rounded-2xl text-center">
          <div className="text-5xl mb-4">🤖</div>
          <p className="text-slate-300 font-semibold mb-2">Первый аудит ещё не запущен</p>
          <p className="text-slate-500 text-sm">Нажмите «Запустить аудит» или подождите ежедневного запуска в 06:00 МСК</p>
        </div>
      )}

      {report && !running && (
        <>
          {/* Score card */}
          <div className={`bg-gradient-to-br ${scoreBg(report.healthScore)} to-transparent border rounded-2xl p-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className={`text-7xl font-black ${scoreColor(report.healthScore)}`}>{report.healthScore}</div>
                <div className="text-slate-300 text-lg font-semibold mt-1">Health Score</div>
                <div className="text-slate-400 text-sm mt-1">
                  {report.runAt && `Последний аудит: ${fmtDate(report.runAt)}`}
                  {report.durationMs && ` · ${(report.durationMs / 1000).toFixed(1)}с`}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-red-900/20 border border-red-700/40 rounded-xl">
                  <div className="text-2xl font-bold text-red-400">{report.issues.critical.length}</div>
                  <div className="text-slate-400 text-xs mt-0.5">Критичных</div>
                </div>
                <div className="text-center p-3 bg-amber-900/20 border border-amber-700/40 rounded-xl">
                  <div className="text-2xl font-bold text-amber-400">{report.issues.warning.length}</div>
                  <div className="text-slate-400 text-xs mt-0.5">Предупреждений</div>
                </div>
                <div className="text-center p-3 bg-emerald-900/20 border border-emerald-700/40 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-400">
                    {report.sections.reduce((s, sec) => s + sec.checks.filter(c => c.status === "OK").length, 0)}
                  </div>
                  <div className="text-slate-400 text-xs mt-0.5">OK</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                  tab === t.id ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab === "overview" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {report.sections.map(s => (
                <div key={s.id} className={`bg-gradient-to-b ${scoreBg(s.score)} to-transparent border rounded-xl p-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <div className="text-white text-sm font-medium">{s.name}</div>
                      <div className="text-slate-500 text-xs">{s.checks.filter(c => c.status === "OK").length}/{s.checks.length} OK</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${scoreColor(s.score)}`}>{s.score}</div>
                    <div className={`text-xs px-1.5 py-0.5 rounded border ${statusBadge(s.status)}`}>{s.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sections */}
          {tab === "sections" && (
            <div className="space-y-3">
              {report.sections.map(s => <SectionCard key={s.id} s={s} />)}
            </div>
          )}

          {/* Issues */}
          {tab === "issues" && (
            <div className="space-y-4">
              {report.issues.critical.length > 0 && (
                <div className="bg-red-900/10 border border-red-700/40 rounded-xl p-4">
                  <h3 className="text-red-300 font-semibold mb-3">🔴 Критические ошибки ({report.issues.critical.length})</h3>
                  {report.issues.critical.map((c, i) => <CheckRow key={i} c={c} />)}
                </div>
              )}
              {report.issues.warning.length > 0 && (
                <div className="bg-amber-900/10 border border-amber-700/40 rounded-xl p-4">
                  <h3 className="text-amber-300 font-semibold mb-3">⚠️ Предупреждения ({report.issues.warning.length})</h3>
                  {report.issues.warning.map((c, i) => <CheckRow key={i} c={c} />)}
                </div>
              )}
              {report.issues.critical.length === 0 && report.issues.warning.length === 0 && (
                <div className="p-8 text-center text-emerald-400">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="font-semibold">Критических проблем не обнаружено</p>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {tab === "recommendations" && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">💡 Рекомендации AI CTO</h3>
              {report.recommendations.length === 0
                ? <p className="text-slate-500 text-sm">Нет рекомендаций</p>
                : (
                  <ol className="space-y-3">
                    {report.recommendations.map((r, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-violet-400 font-bold shrink-0">{i + 1}.</span>
                        <span className="text-slate-300 text-sm">{r}</span>
                      </li>
                    ))}
                  </ol>
                )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
