"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import Link from "next/link";

type Question = {
  id: number; question: string; answer: string; keyword: string;
  seo_score: number; page_created: boolean; page_slug: string | null; asked_at: string;
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? "bg-green-500/15 text-green-400 border-green-500/20"
    : score >= 6 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/20"
    : "bg-slate-700 text-slate-400 border-slate-600";
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      {score}/10
    </span>
  );
}

export default function KnowledgeSeoPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/knowledge-seo");
      const data = await res.json();
      if (data.ok) setQuestions(data.questions);
      else setError(data.error ?? "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createPage(questionId: number) {
    setGenerating(questionId);
    setError("");
    try {
      const res = await fetch("/api/admin/knowledge-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      const data = await res.json();
      if (data.ok) {
        await load();
      } else {
        setError(`Ошибка: ${data.error}`);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setGenerating(null);
    }
  }

  const filtered = questions.filter(q => {
    if (filter === "pending") return !q.page_created;
    if (filter === "done") return q.page_created;
    return true;
  });

  const total = questions.length;
  const done = questions.filter(q => q.page_created).length;
  const highPotential = questions.filter(q => q.seo_score >= 7).length;

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Knowledge → SEO</h1>
          <p className="text-slate-400 text-sm mt-1">
            Вопросы клиентов из базы знаний — конвертируй в SEO-страницы одним кликом
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Вопросов собрано", value: total },
            { label: "Высокий SEO потенциал", value: highPotential, color: "text-yellow-400" },
            { label: "Страниц создано", value: done, color: "text-green-400" },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color ?? "text-white"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {total === 0 && !loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-2xl mb-3">💬</p>
            <p className="text-slate-300 font-medium mb-1">Вопросов пока нет</p>
            <p className="text-slate-500 text-sm">
              Вопросы начнут собираться когда пользователи напишут в{" "}
              <Link href="/knowledge" target="_blank" className="text-blue-400 hover:underline">
                базу знаний
              </Link>
            </p>
          </div>
        )}

        {total > 0 && (
          <>
            {/* Filters */}
            <div className="flex gap-2 mb-5">
              {(["all", "pending", "done"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    filter === f ? "bg-slate-700 border-slate-600 text-white" : "border-slate-700 text-slate-400 hover:text-white"
                  }`}>
                  {f === "all" ? "Все" : f === "pending" ? "Ожидают" : "Созданы"}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-400 text-sm">{error}</div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Вопрос клиента</th>
                    <th className="text-left px-4 py-3">Ключевой запрос</th>
                    <th className="text-center px-4 py-3">SEO</th>
                    <th className="text-center px-4 py-3">Дата</th>
                    <th className="text-center px-4 py-3">Статус</th>
                    <th className="text-right px-4 py-3">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map(q => (
                    <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-slate-200 line-clamp-2 text-sm">{q.question}</p>
                        <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{q.answer}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <span className="text-slate-400 text-xs font-mono line-clamp-2">{q.keyword}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ScoreBadge score={q.seo_score} />
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 text-xs">
                        {q.asked_at.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {q.page_created && q.page_slug ? (
                          <a href={`/${q.page_slug}`} target="_blank" rel="noreferrer"
                            className="px-2 py-0.5 rounded-full text-xs bg-green-500/15 text-green-400 border border-green-500/20 hover:underline">
                            ✓ опубликована
                          </a>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-400">ожидает</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => createPage(q.id)}
                          disabled={generating === q.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            generating === q.id
                              ? "bg-slate-700 text-slate-400"
                              : q.page_created
                              ? "border border-slate-700 text-slate-400 hover:text-white"
                              : q.seo_score >= 7
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "border border-slate-700 text-slate-400 hover:text-white"
                          }`}
                        >
                          {generating === q.id ? "..." : q.page_created ? "Перегенерировать" : "Создать страницу"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="text-center text-slate-500 text-sm py-8">Нет вопросов по фильтру</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
