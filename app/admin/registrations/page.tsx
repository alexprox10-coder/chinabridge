"use client";
import { useState, useEffect } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import type { Tenant } from "@/lib/multitenant/types";

const COUNTRY_FLAG: Record<string, string> = {
  RU: "🇷🇺", KZ: "🇰🇿", BY: "🇧🇾", UZ: "🇺🇿", KG: "🇰🇬", AE: "🇦🇪", CN: "🇨🇳", OTHER: "🌍",
};

function fmt(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "сегодня";
  if (days === 1) return "вчера";
  return `${days}д назад`;
}

export default function RegistrationsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/platform/tenants")
      .then(r => r.json())
      .then(d => { if (d.ok) setTenants(d.tenants); })
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...tenants].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filtered = sorted.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.companyName.toLowerCase().includes(q) ||
      t.owner.toLowerCase().includes(q) ||
      (t.contactTelegram ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white">🆕 Регистрации в ЛК</h1>
            <p className="text-slate-400 text-sm mt-1">
              Клиенты, зарегистрировавшиеся через форму личного кабинета
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-900/40 text-emerald-300 border border-emerald-700 text-sm font-semibold px-3 py-1 rounded-full">
              {tenants.length} всего
            </span>
            <span className="bg-blue-900/40 text-blue-300 border border-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
              {sorted.filter(t => daysSince(t.createdAt) === "сегодня" || daysSince(t.createdAt) === "вчера").length} за 2 дня
            </span>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Поиск по компании, email, Telegram..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
        />

        {loading ? (
          <div className="text-slate-400 text-sm py-12 text-center">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="text-slate-500 text-sm py-12 text-center">Нет регистраций</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60">
                  <th className="text-left text-slate-400 font-medium px-5 py-3">Компания</th>
                  <th className="text-left text-slate-400 font-medium px-5 py-3">Email</th>
                  <th className="text-left text-slate-400 font-medium px-5 py-3">Telegram</th>
                  <th className="text-left text-slate-400 font-medium px-5 py-3">Страна</th>
                  <th className="text-left text-slate-400 font-medium px-5 py-3">Зарегистрирован</th>
                  <th className="text-left text-slate-400 font-medium px-5 py-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr
                    key={t.id}
                    className={`border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${
                      i === 0 ? "bg-emerald-950/10" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {i === 0 && (
                          <span className="text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase">NEW</span>
                        )}
                        <span className="text-white font-medium">{t.companyName}</span>
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">{t.slug}</div>
                    </td>
                    <td className="px-5 py-4">
                      <a href={`mailto:${t.owner}`} className="text-blue-400 hover:text-blue-300">
                        {t.owner}
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      {t.contactTelegram ? (
                        <a
                          href={`https://t.me/${t.contactTelegram.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:text-sky-300"
                        >
                          {t.contactTelegram.startsWith("@") ? t.contactTelegram : `@${t.contactTelegram}`}
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-lg" title={t.country}>
                        {COUNTRY_FLAG[t.country] ?? "🌍"}
                      </span>
                      <span className="ml-1.5 text-slate-400 text-xs">{t.country}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-white">{fmt(t.createdAt)}</div>
                      <div className="text-slate-500 text-xs">{daysSince(t.createdAt)}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {t.contactTelegram && (
                          <a
                            href={`https://t.me/${t.contactTelegram.replace(/^@/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-sky-900/40 border border-sky-700 text-sky-300 px-2 py-1 rounded-lg hover:bg-sky-900/60 transition-colors"
                          >
                            Написать
                          </a>
                        )}
                        <a
                          href={`/admin/tenants/${t.id}`}
                          className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          Профиль
                        </a>
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
