"use client";
import { useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

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

const EMPTY: Lead = { company: "", contact_name: "", email: "", phone: "", niche: "", source: "google_dork" };

export default function OutreachLeadsPage() {
  const [form, setForm] = useState<Lead>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState<Lead[]>([]);
  const [error, setError] = useState("");
  const [copiedDork, setCopiedDork] = useState<number | null>(null);

  const set = (k: keyof Lead) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

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
      setForm(EMPTY);
    } catch (err) {
      setError(`Ошибка: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  async function copyDork(dork: string, i: number) {
    await navigator.clipboard.writeText(dork);
    setCopiedDork(i);
    setTimeout(() => setCopiedDork(null), 1500);
  }

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
          <h2 className="text-white font-semibold mb-4">Добавить контакт</h2>
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
