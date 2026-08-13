"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

type KwRow = {
  id: string; keyword: string; cluster: string; clusterLabel: string;
  clusterGroup: string; estimatedTraffic: string; competition: string;
  priority: number; pageTemplate: string; targetUrl: string;
  generated: boolean; pageStatus: string;
};

const TRAFFIC_COLOR: Record<string, string> = {
  high: "text-green-400", medium: "text-yellow-400", low: "text-slate-400",
};
const GROUP_COLOR: Record<string, string> = {
  geo: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  category: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  commercial: "bg-green-500/15 text-green-400 border-green-500/20",
  informational: "bg-orange-500/15 text-orange-400 border-orange-500/20",
};

export default function SeoPagesAdmin() {
  const [keywords, setKeywords] = useState<KwRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "published">("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, generated: 0 });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seo-pages/generate");
      const data = await res.json();
      if (data.ok) {
        setKeywords(data.keywords);
        setStats({ total: data.total, generated: data.totalGenerated });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function generate(keywordId: string) {
    setGenerating(keywordId);
    setError("");
    try {
      const res = await fetch("/api/admin/seo-pages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywordId }),
      });
      const data = await res.json();
      if (data.ok) {
        await load();
      } else {
        setError(`Ошибка: ${data.error ?? "неизвестная ошибка"} (status ${res.status})`);
      }
    } catch (e) {
      setError(`Сетевая ошибка: ${String(e)}`);
    } finally {
      setGenerating(null);
    }
  }

  const filtered = keywords.filter(k => {
    if (filter === "pending" && k.generated) return false;
    if (filter === "published" && !k.generated) return false;
    if (groupFilter !== "all" && k.clusterGroup !== groupFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">SEO Auto-Pages</h1>
          <p className="text-slate-400 text-sm mt-1">
            Генерация SEO-страниц по ключевым запросам через AI
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Всего ключей", value: stats.total },
            { label: "Сгенерировано", value: stats.generated, color: "text-green-400" },
            { label: "Осталось", value: stats.total - stats.generated, color: "text-yellow-400" },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color ?? "text-white"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          {(["all", "pending", "published"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                filter === f ? "bg-slate-700 border-slate-600 text-white" : "border-slate-700 text-slate-400 hover:text-white"
              }`}>
              {f === "all" ? "Все" : f === "pending" ? "Ожидают" : "Готовы"}
            </button>
          ))}
          <div className="w-px bg-slate-800 mx-1" />
          {["all", "geo", "category", "commercial", "informational"].map(g => (
            <button key={g} onClick={() => setGroupFilter(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                groupFilter === g ? "bg-slate-700 border-slate-600 text-white" : "border-slate-700 text-slate-400 hover:text-white"
              }`}>
              {g === "all" ? "Все группы" : g}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-slate-400 text-sm py-12 text-center">Загрузка...</div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Ключевой запрос</th>
                  <th className="text-left px-4 py-3">Группа</th>
                  <th className="text-center px-4 py-3">Трафик</th>
                  <th className="text-center px-4 py-3">Прио</th>
                  <th className="text-left px-4 py-3">URL</th>
                  <th className="text-center px-4 py-3">Статус</th>
                  <th className="text-right px-4 py-3">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map(kw => (
                  <tr key={kw.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-200 max-w-xs">
                      <span className="line-clamp-1">{kw.keyword}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${GROUP_COLOR[kw.clusterGroup] ?? ""}`}>
                        {kw.clusterGroup}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${TRAFFIC_COLOR[kw.estimatedTraffic] ?? ""}`}>
                        {kw.estimatedTraffic}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300 font-mono text-xs">{kw.priority}</td>
                    <td className="px-4 py-3">
                      {kw.generated ? (
                        <a href={kw.targetUrl} target="_blank" rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs font-mono truncate block max-w-[180px]">
                          {kw.targetUrl}
                        </a>
                      ) : (
                        <span className="text-slate-600 text-xs font-mono truncate block max-w-[180px]">{kw.targetUrl}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {kw.generated ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/15 text-green-400 border border-green-500/20">✓ готова</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-400">ожидает</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => generate(kw.id)}
                        disabled={generating === kw.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          generating === kw.id
                            ? "bg-slate-700 text-slate-400"
                            : kw.generated
                            ? "border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {generating === kw.id ? "..." : kw.generated ? "Перегенерировать" : "Генерировать"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-8">Нет ключей по фильтру</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
