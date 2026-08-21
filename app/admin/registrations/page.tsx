"use client";
import { useState, useEffect } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

interface Client {
  client_id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  telegram?: string;
  country?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

const COUNTRY_FLAG: Record<string, string> = {
  RU: "🇷🇺", KZ: "🇰🇿", BY: "🇧🇾", UZ: "🇺🇿", OTHER: "🌍",
};

function fmt(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function daysSince(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "сегодня";
  if (days === 1) return "вчера";
  return `${days}д назад`;
}

export default function RegistrationsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/clients")
      .then(r => r.json())
      .then(d => { if (d.ok) setClients(d.clients); })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(client_id: string) {
    setDeleting(client_id);
    try {
      const r = await fetch("/api/admin/clients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id }),
      });
      const data = await r.json();
      console.log("[handleDelete] response", data);
      if (data.ok) {
        setClients(prev => prev.filter(c => c.client_id !== client_id));
      } else {
        alert(`Ошибка удаления: ${data.step ?? data.error ?? "unknown"}`);
      }
    } catch (e) {
      alert(`Ошибка: ${e}`);
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  }

  const sorted = [...clients].sort((a, b) => {
    const ta = new Date(a.created_at ?? 0).getTime();
    const tb = new Date(b.created_at ?? 0).getTime();
    return tb - ta;
  });

  const filtered = sorted.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.name ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.company ?? "").toLowerCase().includes(q) ||
      (c.telegram ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q)
    );
  });

  const today = sorted.filter(c => daysSince(c.created_at) === "сегодня").length;
  const week  = sorted.filter(c => {
    if (!c.created_at) return false;
    return Date.now() - new Date(c.created_at).getTime() < 7 * 86_400_000;
  }).length;

  return (
    <>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white">🆕 Регистрации в ЛК</h1>
            <p className="text-slate-400 text-sm mt-1">Клиенты, зарегистрировавшиеся через форму личного кабинета</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-emerald-900/40 text-emerald-300 border border-emerald-700 text-sm font-semibold px-3 py-1 rounded-full">
              {clients.length} всего
            </span>
            <span className="bg-blue-900/40 text-blue-300 border border-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
              {today} сегодня
            </span>
            <span className="bg-purple-900/40 text-purple-300 border border-purple-700 text-sm font-semibold px-3 py-1 rounded-full">
              {week} за неделю
            </span>
          </div>
        </div>

        <input
          type="text"
          placeholder="Поиск по имени, email, компании, Telegram..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
        />

        {loading ? (
          <div className="text-slate-400 text-sm py-12 text-center">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="text-slate-500 text-sm py-12 text-center">
            {search ? "Ничего не найдено" : "Регистраций пока нет"}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60">
                  <th className="text-left text-slate-400 font-medium px-5 py-3">Имя / Компания</th>
                  <th className="text-left text-slate-400 font-medium px-5 py-3">Email</th>
                  <th className="text-left text-slate-400 font-medium px-5 py-3">Телефон</th>
                  <th className="text-left text-slate-400 font-medium px-5 py-3">Telegram</th>
                  <th className="text-left text-slate-400 font-medium px-5 py-3">Страна</th>
                  <th className="text-left text-slate-400 font-medium px-5 py-3">Дата</th>
                  <th className="text-left text-slate-400 font-medium px-5 py-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr
                    key={c.client_id}
                    className={`border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${
                      i === 0 && !search ? "bg-emerald-950/10" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {i === 0 && !search && (
                          <span className="text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase">NEW</span>
                        )}
                        <div>
                          <div className="text-white font-medium">{c.name || "—"}</div>
                          {c.company && <div className="text-slate-500 text-xs">{c.company}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <a href={`mailto:${c.email}`} className="text-blue-400 hover:text-blue-300 break-all">
                        {c.email}
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      {c.phone ? (
                        <a href={`tel:${c.phone}`} className="text-slate-300 hover:text-white">{c.phone}</a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {c.telegram ? (
                        <a
                          href={`https://t.me/${c.telegram.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:text-sky-300"
                        >
                          {c.telegram.startsWith("@") ? c.telegram : `@${c.telegram}`}
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {c.country ? (
                        <>
                          <span className="text-lg">{COUNTRY_FLAG[c.country] ?? "🌍"}</span>
                          <span className="ml-1.5 text-slate-400 text-xs">{c.country}</span>
                        </>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-white text-xs">{fmt(c.created_at)}</div>
                      <div className="text-slate-500 text-xs">{daysSince(c.created_at)}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {c.telegram && (
                          <a
                            href={`https://t.me/${c.telegram.replace(/^@/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-sky-900/40 border border-sky-700 text-sky-300 px-2 py-1 rounded-lg hover:bg-sky-900/60 transition-colors whitespace-nowrap"
                          >
                            Написать
                          </a>
                        )}
                        <a
                          href={`mailto:${c.email}`}
                          className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap"
                        >
                          Email
                        </a>
                        {confirmDelete === c.client_id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(c.client_id)}
                              disabled={deleting === c.client_id}
                              className="text-xs bg-red-900/60 border border-red-700 text-red-300 px-2 py-1 rounded-lg hover:bg-red-900 transition-colors whitespace-nowrap disabled:opacity-50"
                            >
                              {deleting === c.client_id ? "..." : "Да, удалить"}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-xs text-slate-500 hover:text-slate-300 px-1"
                            >
                              Нет
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(c.client_id)}
                            className="text-xs text-slate-600 hover:text-red-400 px-1 transition-colors"
                            title="Удалить"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
