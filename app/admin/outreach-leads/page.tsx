"use client";
import { useState, useEffect, useRef } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

type WfKey = "wb-seller-parser" | "wb-email-discovery" | "wb-vk-phones";
type WfStatus = "idle" | "running" | "done" | "error";

// ── Apify types ─────────────────────────────────────────────────────────────
interface ApifyLead {
  company: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  category: string;
  rating: number;
  reviews: number;
  score: number;
}

const APIFY_PRESETS = [
  { label: "Оптовые магазины Алматы", query: "оптовый магазин Алматы" },
  { label: "Строительные компании Астана", query: "строительная компания Астана" },
  { label: "Автозапчасти оптом KZ", query: "автозапчасти оптом Алматы" },
  { label: "Электроника оптом", query: "электроника оптом Казахстан" },
  { label: "Стройматериалы оптом", query: "стройматериалы оптом Алматы" },
  { label: "Импортёры из Китая", query: "импортёр из Китая Алматы" },
];

function useWorkflowRunner() {
  const [status, setStatus] = useState<Record<WfKey, WfStatus>>({
    "wb-seller-parser": "idle",
    "wb-email-discovery": "idle",
    "wb-vk-phones": "idle",
  });
  const [results, setResults] = useState<Record<WfKey, string>>({
    "wb-seller-parser": "",
    "wb-email-discovery": "",
    "wb-vk-phones": "",
  });

  async function run(workflow: WfKey) {
    setStatus((s) => ({ ...s, [workflow]: "running" }));
    setResults((r) => ({ ...r, [workflow]: "" }));
    try {
      const res = await fetch("/api/admin/run-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow }),
      });
      const data = await res.json();
      if (data.ok || data.executionId) {
        setStatus((s) => ({ ...s, [workflow]: "done" }));
        setResults((r) => ({ ...r, [workflow]: `Запущен (ID: ${data.executionId ?? "—"})` }));
      } else {
        throw new Error(data.error ?? "unknown");
      }
    } catch (e) {
      setStatus((s) => ({ ...s, [workflow]: "error" }));
      setResults((r) => ({ ...r, [workflow]: String(e) }));
    }
  }

  return { status, results, run };
}

const WEBHOOK = "https://n8n.arendadom24.ru/webhook/add-outreach-lead";
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1LmFhyPa9RTQ-i2699t1FjiuoUVXptGKrCMbyOYu3xAI/edit";

const DORK_TEMPLATES = [
  `"поставщик из китая" "@gmail.com" OR "@yandex.ru" site:ru`,
  `"импорт из китая" "контакты" "директор" site:ru`,
  `"поставки из китая" "оптом" "телефон" site:avito.ru`,
  `"ВЭД" "таможенное оформление" "контакты" email site:ru`,
  `"WB поставщик" OR "wildberries поставщик" "Китай" email site:ru`,
  `"купить в китае" "оптом" "контакты" site:ru`,
];

interface Lead {
  company: string;
  contact_name: string;
  email: string;
  phone: string;
  niche: string;
  source: string;
}

interface WbSeller {
  company: string;
  category: string;
  score: number;
  phone: string;
  email: string;
}

const EMPTY_LEAD: Lead = { company: "", contact_name: "", email: "", phone: "", niche: "", source: "google_dork" };
const EMPTY_WB: WbSeller = { company: "", category: "", score: 50, phone: "", email: "" };

// ── ChinaBridge Docs Outreach (МСП реестр + DaData) ─────────────────────────
interface DocsContact {
  id: string;
  company_name: string;
  inn: string;
  okvad_name: string | null;
  region: string | null;
  email: string | null;
  phone: string | null;
  has_china_keywords: boolean;
  status: string;
  created_at: string;
  marketplace_source: string | null;
  shop_name: string | null;
  shop_url: string | null;
  product_count: number | null;
  product_category: string | null;
}
interface DocsReply {
  id: string;
  reply_text: string;
  sentiment: string;
  action: string;
  summary: string;
  created_at: string;
  company_name: string | null;
}

export default function OutreachLeadsPage() {
  const [form, setForm] = useState<Lead>(EMPTY_LEAD);
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState<Lead[]>([]);
  const [error, setError] = useState("");
  const [copiedDork, setCopiedDork] = useState<number | null>(null);
  const { status, results, run } = useWorkflowRunner();

  // ── Apify state ───────────────────────────────────────────────────────────
  const [apifyQuery, setApifyQuery] = useState(APIFY_PRESETS[0].query);
  const [apifyLimit, setApifyLimit] = useState(50);
  const [apifyPhase, setApifyPhase] = useState<"idle"|"starting"|"polling"|"fetching"|"done"|"error">("idle");
  const [apifyRunId, setApifyRunId] = useState("");
  const [apifyDatasetId, setApifyDatasetId] = useState("");
  const [apifyLeads, setApifyLeads] = useState<ApifyLead[]>([]);
  const [apifyTotal, setApifyTotal] = useState(0);
  const [apifyError, setApifyError] = useState("");
  const [apifyImporting, setApifyImporting] = useState(false);
  const [apifyImported, setApifyImported] = useState(0);
  const [apifyCrmImporting, setApifyCrmImporting] = useState(false);
  const [apifyCrmImported, setApifyCrmImported] = useState(0);
  const [apifyOpen, setApifyOpen] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function startApify() {
    setApifyPhase("starting");
    setApifyError("");
    setApifyLeads([]);
    setApifyImported(0);
    try {
      const res = await fetch("/api/admin/apify-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", searchStrings: [apifyQuery], limit: apifyLimit }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "start_failed");
      setApifyRunId(data.runId);
      setApifyDatasetId(data.datasetId);
      setApifyPhase("polling");
      pollRef.current = setInterval(() => pollApify(data.runId, data.datasetId), 5000);
    } catch (e) {
      setApifyPhase("error");
      setApifyError(String(e));
    }
  }

  async function pollApify(runId: string, datasetId: string) {
    try {
      const res = await fetch("/api/admin/apify-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", runId }),
      });
      const data = await res.json();
      if (data.status === "SUCCEEDED") {
        if (pollRef.current) clearInterval(pollRef.current);
        setApifyPhase("fetching");
        fetchApifyResults(datasetId);
      } else if (data.status === "FAILED") {
        if (pollRef.current) clearInterval(pollRef.current);
        setApifyPhase("error");
        setApifyError("Apify run failed");
      }
    } catch {}
  }

  async function fetchApifyResults(datasetId: string) {
    try {
      const res = await fetch("/api/admin/apify-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch", datasetId, limit: 200 }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setApifyLeads(data.leads ?? []);
      setApifyTotal(data.total ?? 0);
      setApifyPhase("done");
    } catch (e) {
      setApifyPhase("error");
      setApifyError(String(e));
    }
  }

  async function importApifyLeads() {
    if (!apifyLeads.length) return;
    setApifyImporting(true);
    try {
      const res = await fetch("/api/admin/apify-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", leads: apifyLeads }),
      });
      const data = await res.json();
      if (data.ok) {
        setApifyImported(data.imported ?? 0);
        setWbCount(c => (c ?? 0) + (data.imported ?? 0));
      }
    } catch {}
    setApifyImporting(false);
  }

  async function importApifyToCrm() {
    if (!apifyLeads.length) return;
    setApifyCrmImporting(true);
    try {
      const res = await fetch("/api/admin/apify-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "to_crm", leads: apifyLeads }),
      });
      const data = await res.json();
      if (data.ok) setApifyCrmImported(data.imported ?? 0);
    } catch {}
    setApifyCrmImporting(false);
  }

  // WB sellers state
  const [wbForm, setWbForm] = useState<WbSeller>(EMPTY_WB);
  const [wbSaving, setWbSaving] = useState(false);
  const [wbAdded, setWbAdded] = useState<WbSeller[]>([]);
  const [wbError, setWbError] = useState("");
  const [wbCount, setWbCount] = useState<number | null>(null);
  const [wbOpen, setWbOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/wb-sellers")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setWbCount(d.count); })
      .catch(() => {});
  }, []);

  const set = (k: keyof Lead) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const setWb = (k: keyof WbSeller) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setWbForm((f) => ({ ...f, [k]: k === "score" ? Number(e.target.value) : e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email) { setError("Email обязателен"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: form }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAdded((prev) => [form, ...prev]);
      setForm(EMPTY_LEAD);
    } catch (err) {
      setError(`Ошибка: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  async function submitWb(e: React.FormEvent) {
    e.preventDefault();
    if (!wbForm.company.trim()) { setWbError("Название компании обязательно"); return; }
    setWbSaving(true);
    setWbError("");
    try {
      const res = await fetch("/api/admin/wb-sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wbForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setWbAdded((prev) => [wbForm, ...prev]);
      setWbCount(c => (c ?? 0) + 1);
      setWbForm(EMPTY_WB);
    } catch (err) {
      setWbError(`Ошибка: ${String(err)}`);
    } finally {
      setWbSaving(false);
    }
  }

  async function copyDork(dork: string, i: number) {
    await navigator.clipboard.writeText(dork);
    setCopiedDork(i);
    setTimeout(() => setCopiedDork(null), 1500);
  }

  // ── AI Import Manager state ────────────────────────────────────────────
  const [aiOpen, setAiOpen] = useState(true);
  const [aiStats, setAiStats] = useState<{
    today: number; week: number; total: number; handoffs: number;
    anonToday: number; tgToday: number;
  } | null>(null);
  const [aiDaily, setAiDaily] = useState<Array<{ day: string; sessions: number }>>([]);
  const [aiSessions, setAiSessions] = useState<Array<{
    id: string; created_at: string; user_telegram: string;
    title: string | null; status: string; msg_count: number; handoffs: number;
  }>>([]);
  const [aiLoading, setAiLoading] = useState(false);

  async function loadAiStats() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/ai-import-stats");
      const data = await res.json();
      if (data.ok) {
        setAiStats(data.stats);
        setAiDaily(data.daily ?? []);
        setAiSessions(data.recentSessions ?? []);
      }
    } catch {}
    setAiLoading(false);
  }

  useEffect(() => { loadAiStats(); }, []);

  // ── Docs Outreach state ────────────────────────────────────────────────
  const [docsOpen, setDocsOpen] = useState(true);
  const [docsStats, setDocsStats] = useState<Record<string, number>>({});
  const [docsContacts, setDocsContacts] = useState<DocsContact[]>([]);
  const [docsReplies, setDocsReplies] = useState<DocsReply[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsEnriching, setDocsEnriching] = useState(false);
  const [docsEnrichResult, setDocsEnrichResult] = useState("");
  const [docsCopied, setDocsCopied] = useState(false);

  async function loadDocsData() {
    setDocsLoading(true);
    try {
      const res = await fetch("/api/admin/outreach-docs");
      const data = await res.json();
      setDocsStats(data.stats ?? {});
      setDocsContacts(data.contacts ?? []);
      setDocsReplies(data.replies ?? []);
    } catch {}
    setDocsLoading(false);
  }

  useEffect(() => { loadDocsData(); }, []);

  async function runDocsEnrich() {
    setDocsEnriching(true);
    setDocsEnrichResult("");
    try {
      const res = await fetch("/api/admin/outreach-docs/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 30 }),
      });
      const data = await res.json();
      if (data.ok) {
        setDocsEnrichResult(`✓ Обработано ${data.processed}, найдено email: ${data.found}`);
        loadDocsData();
      } else {
        setDocsEnrichResult(`✗ ${data.error ?? "ошибка"}`);
      }
    } catch (e) {
      setDocsEnrichResult(`✗ ${String(e)}`);
    }
    setDocsEnriching(false);
  }

  const MSP_COMMAND = "node scripts/outreach/parse-msp-registry.mjs --limit=1500";
  async function copyMspCommand() {
    await navigator.clipboard.writeText(MSP_COMMAND);
    setDocsCopied(true);
    setTimeout(() => setDocsCopied(false), 1500);
  }

  const WB_DISCOVERY_COMMAND = "node scripts/outreach/wb-discovery.mjs";
  const OZON_DISCOVERY_COMMAND = "node scripts/outreach/ozon-discovery.mjs";
  const MARKETPLACE_ENRICH_COMMAND = "DADATA_TOKEN=xxx node scripts/outreach/marketplace-enrich.mjs";
  const [wbCmdCopied, setWbCmdCopied] = useState<"wb" | "ozon" | "enrich" | null>(null);
  async function copyWbCommand(which: "wb" | "ozon" | "enrich") {
    const cmd = which === "wb" ? WB_DISCOVERY_COMMAND : which === "ozon" ? OZON_DISCOVERY_COMMAND : MARKETPLACE_ENRICH_COMMAND;
    await navigator.clipboard.writeText(cmd);
    setWbCmdCopied(which);
    setTimeout(() => setWbCmdCopied(null), 1500);
  }

  const [docsSourceFilter, setDocsSourceFilter] = useState<"all" | "msp_registry" | "wb_pilot" | "ozon_pilot">("all");
  const filteredDocsContacts = docsContacts.filter((c) => {
    const source = c.marketplace_source === "wb_pilot" ? "wb_pilot" : c.marketplace_source === "ozon_pilot" ? "ozon_pilot" : "msp_registry";
    return docsSourceFilter === "all" || source === docsSourceFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Email Outreach — Добавить лид</h1>
            <p className="text-slate-500 text-sm mt-1">Google Dork → скопируй контакт → заполни форму → письмо придёт в Telegram</p>
          </div>
          <a
            href={SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-900/30 border border-emerald-800 text-emerald-400 text-sm hover:bg-emerald-900/50 transition"
          >
            📊 Google Sheet
          </a>
        </div>

        {/* ── ChinaBridge AI Import Manager ── */}
        <div className="bg-slate-900 border border-violet-900/50 rounded-xl overflow-hidden">
          <button
            onClick={() => setAiOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/40 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div className="text-left">
                <h2 className="text-white font-semibold">ChinaBridge AI Import Manager</h2>
                <p className="text-slate-500 text-xs mt-0.5">Сессии, аналитика, хэндоффы → менеджеру</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {aiStats && (
                <span className="text-xs px-2 py-1 rounded-full bg-violet-900/50 text-violet-400 font-medium">
                  {aiStats.today} сегодня
                </span>
              )}
              <a
                href="/ai"
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-xs px-2 py-1 rounded-full bg-slate-700/60 text-slate-400 hover:text-white transition"
              >
                → /ai
              </a>
              <span className="text-slate-500 text-sm">{aiOpen ? "▲" : "▼"}</span>
            </div>
          </button>

          {aiOpen && (
            <div className="border-t border-slate-800 p-5 space-y-5">
              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Сессий сегодня", value: aiStats?.today ?? "—", color: "text-violet-400" },
                  { label: "За 7 дней", value: aiStats?.week ?? "—", color: "text-violet-300" },
                  { label: "Всего сессий", value: aiStats?.total ?? "—", color: "text-slate-300" },
                  { label: "Хэндоффов", value: aiStats?.handoffs ?? "—", color: "text-emerald-400" },
                  { label: "Анонимных (сегодня)", value: aiStats?.anonToday ?? "—", color: "text-slate-400" },
                  { label: "Telegram (сегодня)", value: aiStats?.tgToday ?? "—", color: "text-sky-400" },
                ].map(s => (
                  <div key={s.label} className="bg-slate-800/50 rounded-xl p-3 text-center">
                    <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
                    <div className="text-slate-500 text-xs mt-1 leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Refresh + link */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={loadAiStats}
                  disabled={aiLoading}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition"
                >
                  {aiLoading ? "⏳..." : "↻ Обновить"}
                </button>
                {aiDaily.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {aiDaily.map(d => (
                      <span key={d.day} className="text-xs text-slate-500">
                        {new Date(d.day).toLocaleDateString("ru-RU", { weekday: "short", day: "numeric" })}: <span className="text-violet-400 font-medium">{d.sessions}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent sessions */}
              {aiSessions.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800/60 text-slate-400 text-left">
                        <th className="px-3 py-2 font-medium text-xs">Пользователь</th>
                        <th className="px-3 py-2 font-medium text-xs">Тема</th>
                        <th className="px-3 py-2 font-medium text-xs">Сообщений</th>
                        <th className="px-3 py-2 font-medium text-xs">Хэндофф</th>
                        <th className="px-3 py-2 font-medium text-xs">Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiSessions.map(s => (
                        <tr key={s.id} className="border-t border-slate-800/60 hover:bg-slate-800/30 transition">
                          <td className="px-3 py-2 text-xs">
                            {s.user_telegram?.startsWith("anon-") ? (
                              <span className="text-slate-500">анонимный</span>
                            ) : (
                              <span className="text-sky-400">{s.user_telegram || "—"}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-white text-xs max-w-[200px] truncate">{s.title || "—"}</td>
                          <td className="px-3 py-2 text-slate-400 text-xs">{s.msg_count}</td>
                          <td className="px-3 py-2 text-xs">
                            {s.handoffs > 0 ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-400">✓ хэндофф</span>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">
                            {new Date(s.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── ChinaBridge Docs Outreach (МСП реестр + DaData) ── */}
        <div className="bg-slate-900 border border-sky-900/50 rounded-xl overflow-hidden">
          <button
            onClick={() => setDocsOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/40 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗂️</span>
              <div className="text-left">
                <h2 className="text-white font-semibold">ChinaBridge Docs — Холодный аутрич</h2>
                <p className="text-slate-500 text-xs mt-0.5">Реестр МСП (ОКВЭД 46) + DaData обогащение → черновики писем в Telegram</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {docsStats.new !== undefined && (
                <span className="text-xs px-2 py-1 rounded-full bg-sky-900/50 text-sky-400 font-medium">
                  {Object.values(docsStats).reduce((a, b) => a + b, 0)} контактов
                </span>
              )}
              <span className="text-slate-500 text-sm">{docsOpen ? "▲" : "▼"}</span>
            </div>
          </button>

          {docsOpen && (
            <div className="border-t border-slate-800 p-5 space-y-5">
              {/* Stats badges */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "new", label: "Новые", color: "bg-slate-700 text-slate-300" },
                  { key: "enriched", label: "Обогащены (есть email)", color: "bg-sky-900/50 text-sky-400" },
                  { key: "draft_ready", label: "Черновик отправлен", color: "bg-amber-900/50 text-amber-400" },
                  { key: "sent", label: "Отправлено", color: "bg-emerald-900/50 text-emerald-400" },
                ].map(s => (
                  <span key={s.key} className={`text-xs px-3 py-1.5 rounded-full font-medium ${s.color}`}>
                    {s.label}: {docsStats[s.key] ?? 0}
                  </span>
                ))}
                <button
                  onClick={loadDocsData}
                  disabled={docsLoading}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition"
                >
                  {docsLoading ? "⏳..." : "↻ Обновить"}
                </button>
              </div>

              {/* Step 1: MSP parsing (manual, runs locally) */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📥</span>
                  <span className="text-white font-medium text-sm">Шаг 1 — Загрузить компании из реестра МСП</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">запускать локально</span>
                </div>
                <p className="text-slate-500 text-xs mb-3">
                  Скачивает открытые данные ФНС (~2 ГБ, весь реестр МСП), фильтрует ОКВЭД 46.x (оптовая торговля)
                  и компании с &quot;китайскими&quot; словами в названии. Требует прямого доступа к Neon — запускается на твоём компьютере, не из админки.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded-lg font-mono overflow-x-auto whitespace-nowrap">
                    {MSP_COMMAND}
                  </code>
                  <button
                    onClick={copyMspCommand}
                    className="shrink-0 px-3 py-2 rounded-lg text-xs border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white transition"
                  >
                    {docsCopied ? "✓" : "Копировать"}
                  </button>
                </div>
              </div>

              {/* Step 1b: WB marketplace seller discovery (manual, runs locally) */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🛍️</span>
                  <span className="text-white font-medium text-sm">Шаг 1b — Найти продавцов на WB + Ozon (пилот: автозапчасти)</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">запускать локально</span>
                </div>
                <p className="text-slate-500 text-xs mb-3">
                  Публичный поисковый JSON без авторизации (не Seller API) → топ-50 продавцов категории по числу товаров на каждой площадке.
                  Затем единое обогащение: ИНН со страницы магазина → DaData на контакты.
                  <span className="block mt-1 text-amber-500/80">⚠️ Ozon защищён антиботом (Qrator) — может не сработать с обычного HTTP-клиента, это ожидаемо.</span>
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded-lg font-mono overflow-x-auto whitespace-nowrap">
                      {WB_DISCOVERY_COMMAND}
                    </code>
                    <button onClick={() => copyWbCommand("wb")} className="shrink-0 px-3 py-2 rounded-lg text-xs border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white transition">
                      {wbCmdCopied === "wb" ? "✓" : "Копировать"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded-lg font-mono overflow-x-auto whitespace-nowrap">
                      {OZON_DISCOVERY_COMMAND}
                    </code>
                    <button onClick={() => copyWbCommand("ozon")} className="shrink-0 px-3 py-2 rounded-lg text-xs border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white transition">
                      {wbCmdCopied === "ozon" ? "✓" : "Копировать"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded-lg font-mono overflow-x-auto whitespace-nowrap">
                      {MARKETPLACE_ENRICH_COMMAND}
                    </code>
                    <button onClick={() => copyWbCommand("enrich")} className="shrink-0 px-3 py-2 rounded-lg text-xs border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white transition">
                      {wbCmdCopied === "enrich" ? "✓" : "Копировать"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: DaData enrichment (can run from admin) */}
              <div className="bg-slate-800/60 border border-sky-900/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✨</span>
                  <span className="text-white font-medium text-sm">Шаг 2 — Обогатить email через DaData</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-sky-900/50 text-sky-400">ШАГ 2</span>
                </div>
                <p className="text-slate-500 text-xs mb-3">
                  Ищет email/телефон по ИНН через DaData API (до 30 компаний за раз, приоритет — с китайскими ключевыми словами).
                </p>
                <button
                  onClick={runDocsEnrich}
                  disabled={docsEnriching || !docsStats.new}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition border bg-sky-900/20 border-sky-800 text-sky-400 hover:bg-sky-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {docsEnriching ? "⏳ Обогащаю..." : `▶ Обогатить 30 контактов (${docsStats.new ?? 0} в очереди)`}
                </button>
                {docsEnrichResult && (
                  <p className={`text-xs mt-2 ${docsEnrichResult.startsWith("✗") ? "text-red-400" : "text-emerald-400"}`}>{docsEnrichResult}</p>
                )}
              </div>

              {/* Step 3 info */}
              <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-4 text-xs text-blue-300 space-y-1">
                <p className="font-medium text-blue-200">Дальше — автоматически:</p>
                <p>3. Каждый день в 10:00 МСК n8n берёт 20 обогащённых контактов и генерирует письмо (GPT-4o-mini)</p>
                <p>4. Черновик приходит тебе в Telegram — копируешь и отправляешь вручную</p>
                <p>5. Ответ клиента — перешли его текстом тому же боту → AI классифицирует и сохранит, при интересе пришлёт 🔥 уведомление</p>
                <div className="flex gap-3 mt-2">
                  <a href="https://n8n.arendadom24.ru/workflow/1gXmOr3w1BT9wlxz" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">→ Workflow: Generate & Draft</a>
                  <a href="https://n8n.arendadom24.ru/workflow/vB6ImvcO6PvSvo0T" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">→ Workflow: Reply Handler</a>
                </div>
              </div>

              {/* Contacts table */}
              {docsContacts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {([
                      { key: "all", label: "Все" },
                      { key: "msp_registry", label: "МСП-реестр" },
                      { key: "wb_pilot", label: "🛍️ WB" },
                      { key: "ozon_pilot", label: "🟠 Ozon" },
                    ] as const).map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setDocsSourceFilter(f.key)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium border transition ${
                          docsSourceFilter === f.key
                            ? "bg-sky-900/50 border-sky-700 text-sky-400"
                            : "border-slate-700 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-800/60 text-slate-400 text-left">
                          <th className="px-3 py-2 font-medium text-xs">Компания / Магазин</th>
                          <th className="px-3 py-2 font-medium text-xs">ОКВЭД / Товаров</th>
                          <th className="px-3 py-2 font-medium text-xs">Регион</th>
                          <th className="px-3 py-2 font-medium text-xs">Email</th>
                          <th className="px-3 py-2 font-medium text-xs">Телефон</th>
                          <th className="px-3 py-2 font-medium text-xs">🇨🇳</th>
                          <th className="px-3 py-2 font-medium text-xs">Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocsContacts.slice(0, 15).map(c => (
                          <tr key={c.id} className="border-t border-slate-800/60 hover:bg-slate-800/30 transition">
                            <td className="px-3 py-2 text-white text-xs max-w-[200px] truncate">
                              {c.marketplace_source === "wb_pilot" && <span className="mr-1">🛍️</span>}
                              {c.marketplace_source === "ozon_pilot" && <span className="mr-1">🟠</span>}
                              {c.shop_url ? (
                                <a href={c.shop_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  {c.shop_name || c.company_name}
                                </a>
                              ) : (c.shop_name || c.company_name)}
                            </td>
                            <td className="px-3 py-2 text-slate-400 text-xs max-w-[140px] truncate">
                              {c.marketplace_source === "wb_pilot" || c.marketplace_source === "ozon_pilot"
                                ? `${c.product_count ?? "—"} тов. (${c.product_category ?? "—"})`
                                : (c.okvad_name || "—")}
                            </td>
                            <td className="px-3 py-2 text-slate-400 text-xs">{c.region || "—"}</td>
                            <td className="px-3 py-2 text-blue-400 text-xs">{c.email || "—"}</td>
                            <td className="px-3 py-2 text-blue-400 text-xs">{c.phone || "—"}</td>
                            <td className="px-3 py-2 text-xs">{c.has_china_keywords ? "✓" : ""}</td>
                            <td className="px-3 py-2 text-xs">
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                c.status === "enriched" ? "bg-sky-900/50 text-sky-400" :
                                c.status === "draft_ready" ? "bg-amber-900/50 text-amber-400" :
                                c.status === "sent" ? "bg-emerald-900/50 text-emerald-400" :
                                c.status === "no_inn_found" ? "bg-red-900/30 text-red-400" :
                                "bg-slate-700 text-slate-400"
                              }`}>{c.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Replies */}
              {docsReplies.length > 0 && (
                <div>
                  <p className="text-slate-500 text-xs mb-2">Последние ответы клиентов:</p>
                  <div className="space-y-2">
                    {docsReplies.slice(0, 5).map(r => (
                      <div key={r.id} className="bg-slate-800/50 rounded-lg px-3 py-2 flex items-start gap-3">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                          r.action === "interested" ? "bg-emerald-900/50 text-emerald-400" :
                          r.action === "unsubscribe" ? "bg-red-900/50 text-red-400" :
                          "bg-slate-700 text-slate-400"
                        }`}>{r.action}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs">{r.company_name || "—"}</p>
                          <p className="text-slate-400 text-xs">{r.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Apify Google Maps Lead Generator ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setApifyOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/40 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <div className="text-left">
                <h2 className="text-white font-semibold">Apify — Google Maps лиды</h2>
                <p className="text-slate-500 text-xs mt-0.5">Автоматический сбор контактов компаний через Google Maps · ~0.4¢ за лид</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {apifyLeads.length > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-900/50 text-emerald-400 font-medium">
                  {apifyLeads.length} лидов
                </span>
              )}
              <span className="text-slate-500 text-sm">{apifyOpen ? "▲" : "▼"}</span>
            </div>
          </button>

          {apifyOpen && (
            <div className="border-t border-slate-800 p-5 space-y-5">
              {/* Preset queries */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Готовые запросы:</p>
                <div className="flex flex-wrap gap-2">
                  {APIFY_PRESETS.map(p => (
                    <button
                      key={p.query}
                      onClick={() => setApifyQuery(p.query)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition ${
                        apifyQuery === p.query
                          ? "bg-emerald-900/40 border-emerald-700 text-emerald-300"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom query + limit */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={apifyQuery}
                  onChange={e => setApifyQuery(e.target.value)}
                  placeholder="Введи свой запрос..."
                  className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 placeholder-slate-600"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-xs text-slate-500 whitespace-nowrap">Лимит:</label>
                  <select
                    value={apifyLimit}
                    onChange={e => setApifyLimit(Number(e.target.value))}
                    className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
              </div>

              {/* Start button + status */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={startApify}
                  disabled={apifyPhase === "starting" || apifyPhase === "polling" || apifyPhase === "fetching" || !apifyQuery.trim()}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium transition border bg-emerald-700 border-emerald-600 text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {apifyPhase === "starting" && "⏳ Запускаю..."}
                  {apifyPhase === "polling" && "⏳ Парсю Google Maps..."}
                  {apifyPhase === "fetching" && "⏳ Загружаю результаты..."}
                  {(apifyPhase === "idle" || apifyPhase === "done" || apifyPhase === "error") && "▶ Собрать лиды"}
                </button>

                {apifyPhase === "polling" && (
                  <span className="text-xs text-slate-400 animate-pulse">Обычно 1-3 минуты...</span>
                )}
                {apifyPhase === "done" && apifyTotal > 0 && (
                  <span className="text-xs text-emerald-400">✓ Найдено {apifyTotal} мест, показываем {apifyLeads.length}</span>
                )}
                {apifyPhase === "error" && (
                  <span className="text-xs text-red-400">✗ {apifyError}</span>
                )}
              </div>

              {/* Results table */}
              {apifyLeads.length > 0 && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-800/60 text-slate-400 text-left">
                          <th className="px-3 py-2 font-medium text-xs">Компания</th>
                          <th className="px-3 py-2 font-medium text-xs">Телефон</th>
                          <th className="px-3 py-2 font-medium text-xs">★</th>
                          <th className="px-3 py-2 font-medium text-xs">Отзывов</th>
                          <th className="px-3 py-2 font-medium text-xs">Score</th>
                          <th className="px-3 py-2 font-medium text-xs">Сайт</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apifyLeads.slice(0, 20).map((lead, i) => (
                          <tr key={i} className="border-t border-slate-800/60 hover:bg-slate-800/30 transition">
                            <td className="px-3 py-2 text-white text-xs max-w-[200px] truncate">{lead.company || "—"}</td>
                            <td className="px-3 py-2 text-blue-400 text-xs whitespace-nowrap">{lead.phone || "—"}</td>
                            <td className="px-3 py-2 text-amber-400 text-xs">{lead.rating || "—"}</td>
                            <td className="px-3 py-2 text-slate-400 text-xs">{lead.reviews || 0}</td>
                            <td className="px-3 py-2 text-xs">
                              <span className={`px-1.5 py-0.5 rounded font-bold text-xs ${lead.score >= 40 ? "bg-emerald-900/50 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                                {lead.score}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs max-w-[150px] truncate">
                              {lead.website ? (
                                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                  {lead.website.replace(/^https?:\/\//, "").slice(0, 30)}
                                </a>
                              ) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {apifyLeads.length > 20 && (
                      <div className="px-3 py-2 bg-slate-800/30 text-slate-500 text-xs text-center border-t border-slate-800">
                        + ещё {apifyLeads.length - 20} лидов (все будут импортированы)
                      </div>
                    )}
                  </div>

                  {/* Import buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={importApifyLeads}
                      disabled={apifyImporting || apifyImported > 0}
                      className="px-5 py-2.5 rounded-lg text-sm font-medium transition border bg-orange-700 border-orange-600 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {apifyImporting && "⏳ Импортирую..."}
                      {apifyImported > 0 && `✓ ${apifyImported} → база WB`}
                      {!apifyImporting && apifyImported === 0 && `➕ В базу WB (${apifyLeads.length})`}
                    </button>
                    <button
                      onClick={importApifyToCrm}
                      disabled={apifyCrmImporting || apifyCrmImported > 0}
                      className="px-5 py-2.5 rounded-lg text-sm font-medium transition border bg-blue-700 border-blue-600 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {apifyCrmImporting && "⏳ Импортирую в CRM..."}
                      {apifyCrmImported > 0 && `✓ ${apifyCrmImported} → CRM Лиды`}
                      {!apifyCrmImporting && apifyCrmImported === 0 && `➕ В CRM Лиды (${apifyLeads.length})`}
                    </button>
                    <span className="text-xs text-slate-500">
                      {apifyImported === 0 && apifyCrmImported === 0 && "WB — для Email Discovery · CRM — виден в разделе Лиды"}
                      {apifyImported > 0 && apifyCrmImported === 0 && "Сохранено в WB базу · Нажми «В CRM Лиды» чтобы увидеть в разделе Лиды"}
                      {apifyCrmImported > 0 && "Лиды добавлены — открой раздел «Лиды» чтобы их увидеть"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* WB Automation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-1">WB Автоматизация</h2>
          <p className="text-slate-500 text-xs mb-4">Сначала собери продавцов (ШАГ 1), потом запусти поиск контактов (ШАГ 2 / 3)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* WB Seller Parser */}
            <div className="bg-slate-800/60 border border-orange-900/40 rounded-xl p-4 flex flex-col gap-3 sm:col-span-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🕷️</span>
                  <span className="text-white font-medium text-sm">Собрать WB продавцов</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-orange-900/50 text-orange-400">ШАГ 1</span>
                </div>
                <p className="text-slate-500 text-xs">Парсит топ WB продавцов по 8 категориям через публичный поиск Wildberries. Скорит по количеству отзывов и сохраняет в базу. Запускай раз в неделю.</p>
              </div>
              <button
                onClick={() => run("wb-seller-parser")}
                disabled={status["wb-seller-parser"] === "running"}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium transition border ${
                  status["wb-seller-parser"] === "running"
                    ? "bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed"
                    : status["wb-seller-parser"] === "done"
                    ? "bg-emerald-900/30 border-emerald-700 text-emerald-400 hover:bg-emerald-900/50"
                    : status["wb-seller-parser"] === "error"
                    ? "bg-red-900/30 border-red-700 text-red-400 hover:bg-red-900/50"
                    : "bg-orange-900/20 border-orange-800 text-orange-400 hover:bg-orange-900/40"
                }`}
              >
                {status["wb-seller-parser"] === "running" && "⏳ Запускаю..."}
                {status["wb-seller-parser"] === "done" && "✓ Запущен — результат придёт в Telegram"}
                {status["wb-seller-parser"] === "error" && "✗ Ошибка"}
                {status["wb-seller-parser"] === "idle" && "▶ Запустить парсер (≈3-5 мин)"}
              </button>
              {results["wb-seller-parser"] && (
                <p className={`text-xs ${status["wb-seller-parser"] === "error" ? "text-red-400" : "text-emerald-400"}`}>
                  {results["wb-seller-parser"]}
                </p>
              )}
            </div>

            {/* Email Discovery */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🔍</span>
                  <span className="text-white font-medium text-sm">WB → Email Discovery</span>
                </div>
                <p className="text-slate-500 text-xs">Ищет email WB продавцов (score≥40) через dadata. Найденные контакты сразу попадают в Google Sheet для холодной рассылки.</p>
              </div>
              <button
                onClick={() => run("wb-email-discovery")}
                disabled={status["wb-email-discovery"] === "running"}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition border ${
                  status["wb-email-discovery"] === "running"
                    ? "bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed"
                    : status["wb-email-discovery"] === "done"
                    ? "bg-emerald-900/30 border-emerald-700 text-emerald-400 hover:bg-emerald-900/50"
                    : status["wb-email-discovery"] === "error"
                    ? "bg-red-900/30 border-red-700 text-red-400 hover:bg-red-900/50"
                    : "bg-blue-900/20 border-blue-800 text-blue-400 hover:bg-blue-900/40"
                }`}
              >
                {status["wb-email-discovery"] === "running" && "⏳ Запускаю..."}
                {status["wb-email-discovery"] === "done" && "✓ Запущен"}
                {status["wb-email-discovery"] === "error" && "✗ Ошибка"}
                {status["wb-email-discovery"] === "idle" && "▶ Запустить"}
              </button>
              {results["wb-email-discovery"] && (
                <p className={`text-xs ${status["wb-email-discovery"] === "error" ? "text-red-400" : "text-emerald-400"}`}>
                  {results["wb-email-discovery"]}
                </p>
              )}
            </div>

            {/* VK Phones */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📱</span>
                  <span className="text-white font-medium text-sm">WB → VK Аудитория</span>
                </div>
                <p className="text-slate-500 text-xs">Собирает телефоны WB продавцов (score≥40) и отправляет список в Telegram для загрузки в VK Custom Audience через LidFly.</p>
              </div>
              <button
                onClick={() => run("wb-vk-phones")}
                disabled={status["wb-vk-phones"] === "running"}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition border ${
                  status["wb-vk-phones"] === "running"
                    ? "bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed"
                    : status["wb-vk-phones"] === "done"
                    ? "bg-emerald-900/30 border-emerald-700 text-emerald-400 hover:bg-emerald-900/50"
                    : status["wb-vk-phones"] === "error"
                    ? "bg-red-900/30 border-red-700 text-red-400 hover:bg-red-900/50"
                    : "bg-violet-900/20 border-violet-800 text-violet-400 hover:bg-violet-900/40"
                }`}
              >
                {status["wb-vk-phones"] === "running" && "⏳ Запускаю..."}
                {status["wb-vk-phones"] === "done" && "✓ Запущен"}
                {status["wb-vk-phones"] === "error" && "✗ Ошибка"}
                {status["wb-vk-phones"] === "idle" && "▶ Запустить"}
              </button>
              {results["wb-vk-phones"] && (
                <p className={`text-xs ${status["wb-vk-phones"] === "error" ? "text-red-400" : "text-emerald-400"}`}>
                  {results["wb-vk-phones"]}
                </p>
              )}
            </div>
          </div>
          <p className="text-slate-600 text-xs mt-3">Результат воркфлоу придёт в Telegram. Запуск занимает 1-3 минуты.</p>
        </div>

        {/* WB Sellers Database */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setWbOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/40 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🏪</span>
              <div className="text-left">
                <h2 className="text-white font-semibold">База WB продавцов</h2>
                <p className="text-slate-500 text-xs mt-0.5">Продавцы из которых WB автоматизация ищет email и телефоны</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {wbCount !== null && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  wbCount > 0 ? "bg-emerald-900/50 text-emerald-400" : "bg-slate-800 text-slate-500"
                }`}>
                  {wbCount} в базе
                </span>
              )}
              <span className="text-slate-500 text-sm">{wbOpen ? "▲" : "▼"}</span>
            </div>
          </button>

          {wbOpen && (
            <div className="border-t border-slate-800 p-5">
              {wbCount === 0 && wbAdded.length === 0 && (
                <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-3 mb-5 text-amber-300 text-xs">
                  База пустая — WB автоматизация найдёт 0 контактов. Добавь хотя бы несколько продавцов ниже.
                </div>
              )}

              <form onSubmit={submitWb} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Название компании <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={wbForm.company}
                      onChange={setWb("company")}
                      placeholder="ООО Торговый Дом..."
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 placeholder-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Категория / Ниша</label>
                    <input
                      type="text"
                      value={wbForm.category}
                      onChange={setWb("category")}
                      placeholder="Электроника, одежда, мебель..."
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 placeholder-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Телефон</label>
                    <input
                      type="text"
                      value={wbForm.phone}
                      onChange={setWb("phone")}
                      placeholder="+7 999 000-00-00"
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 placeholder-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Email (если уже известен)</label>
                    <input
                      type="email"
                      value={wbForm.email}
                      onChange={setWb("email")}
                      placeholder="director@company.ru"
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 placeholder-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-2">
                    Оценка привлекательности: <span className={`font-bold ${wbForm.score >= 60 ? "text-emerald-400" : wbForm.score >= 40 ? "text-amber-400" : "text-slate-400"}`}>{wbForm.score}/100</span>
                    <span className="text-slate-600 ml-2">(≥40 — попадает в WB автоматизацию)</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={wbForm.score}
                    onChange={setWb("score")}
                    className="w-full accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                    <span>0 — не интересен</span>
                    <span>40 — порог автоматизации</span>
                    <span>100 — топ</span>
                  </div>
                </div>

                {wbError && <p className="text-red-400 text-sm">{wbError}</p>}

                <button
                  type="submit"
                  disabled={wbSaving}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
                >
                  {wbSaving ? "Сохраняю..." : "➕ Добавить в базу WB"}
                </button>
              </form>

              {/* Added WB sellers this session */}
              {wbAdded.length > 0 && (
                <div className="mt-5 border-t border-slate-800 pt-4">
                  <p className="text-slate-500 text-xs mb-3">Добавлено в эту сессию:</p>
                  <div className="space-y-2">
                    {wbAdded.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${s.score >= 40 ? "bg-emerald-900/50 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                          {s.score}
                        </span>
                        <span className="text-white text-sm flex-1">{s.company}</span>
                        {s.category && <span className="text-slate-500 text-xs">{s.category}</span>}
                        {s.phone && <span className="text-blue-400 text-xs">{s.phone}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dork templates */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-3">Google Dork запросы для ChinaBridge</h2>
          <div className="space-y-2">
            {DORK_TEMPLATES.map((dork, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <code className="flex-1 text-xs text-slate-300 bg-slate-800 px-3 py-2 rounded-lg font-mono break-all">
                  {dork}
                </code>
                <button
                  onClick={() => copyDork(dork, i)}
                  className="shrink-0 px-3 py-2 rounded-lg text-xs border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white transition"
                >
                  {copiedDork === i ? "✓" : "Копировать"}
                </button>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(dork)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-3 py-2 rounded-lg text-xs border border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-400 transition"
                >
                  Открыть
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Add lead form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Добавить контакт в Email Outreach</h2>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Название компании</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={set("company")}
                  placeholder="ООО Торговый Дом..."
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Контактное лицо</label>
                <input
                  type="text"
                  value={form.contact_name}
                  onChange={set("contact_name")}
                  placeholder="Иванов Иван"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Email <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="director@company.ru"
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Телефон</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+7 999 000-00-00"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Ниша / Что импортируют</label>
                <input
                  type="text"
                  value={form.niche}
                  onChange={set("niche")}
                  placeholder="Электроника, одежда, мебель..."
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Источник</label>
                <input
                  type="text"
                  value={form.source}
                  onChange={set("source")}
                  placeholder="google_dork / avito / site:ru"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 placeholder-slate-600"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
            >
              {saving ? "Добавляю..." : "➕ Добавить в очередь рассылки"}
            </button>
          </form>
        </div>

        {/* Added this session */}
        {added.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-white font-semibold">Добавлено в эту сессию</h2>
              <span className="text-slate-500 text-sm">{added.length} лидов</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-left border-b border-slate-800">
                  <th className="px-4 py-2 font-medium">Компания</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Ниша</th>
                  <th className="px-4 py-2 font-medium">Источник</th>
                </tr>
              </thead>
              <tbody>
                {added.map((lead, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td className="px-4 py-2 text-white">{lead.company || "—"}</td>
                    <td className="px-4 py-2 text-slate-300">{lead.email}</td>
                    <td className="px-4 py-2 text-slate-400">{lead.niche || "—"}</td>
                    <td className="px-4 py-2 text-slate-500 text-xs">{lead.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info box */}
        <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-4 text-sm text-blue-300 space-y-1">
          <p className="font-medium text-blue-200">Как работает автоматика:</p>
          <p>1. Ты добавляешь контакт → он попадает в Google Sheet со статусом <code className="bg-blue-900/40 px-1 rounded">new</code></p>
          <p>2. Каждый будний день в 10:00 МСК n8n читает новые лиды</p>
          <p>3. GPT-4o-mini пишет персонализированное холодное письмо</p>
          <p>4. Черновик приходит тебе в Telegram (ДИРЕКТОР)</p>
          <p>5. Ты копируешь и отправляешь вручную из Gmail</p>
        </div>

      </main>
    </div>
  );
}
