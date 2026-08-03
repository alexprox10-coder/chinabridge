"use client";
import { useState } from "react";
import Link from "next/link";
import { ARTICLES } from "@/lib/blog/articles";
import type { Article } from "@/lib/blog/types";

export default function AdminBlogPage() {
  const [articles, setArticles] = useState<Article[]>(ARTICLES);
  const [search, setSearch] = useState("");

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B1F3A] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin/dashboard" className="text-[#8899aa] text-sm hover:text-white mb-1 block">
              ← Назад
            </Link>
            <h1 className="text-2xl font-bold">Управление блогом</h1>
          </div>
          <div className="text-xs text-[#8899aa] bg-[#0f2644]/60 border border-[#243a5e] rounded-lg px-3 py-2">
            Статьи хранятся в <code>lib/blog/articles.ts</code>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Всего статей", value: articles.length },
            { label: "Опубликовано", value: articles.filter((a) => a.published).length },
            { label: "Черновики", value: articles.filter((a) => !a.published).length },
          ].map((s) => (
            <div key={s.label} className="bg-[#0f2644]/60 border border-[#243a5e] rounded-xl p-4">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-[#8899aa] text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Поиск по заголовку или категории..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0f2644] border border-[#243a5e] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#8899aa] focus:outline-none focus:border-[#00A86B]/50"
          />
        </div>

        {/* Articles table */}
        <div className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#243a5e]">
                  <th className="text-left py-3 px-4 text-[#8899aa] font-medium">Заголовок</th>
                  <th className="text-left py-3 px-4 text-[#8899aa] font-medium">Категория</th>
                  <th className="text-left py-3 px-4 text-[#8899aa] font-medium">Дата</th>
                  <th className="text-left py-3 px-4 text-[#8899aa] font-medium">Статус</th>
                  <th className="text-left py-3 px-4 text-[#8899aa] font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((article) => (
                  <tr key={article.id} className="border-b border-[#243a5e]/50 hover:bg-white/5">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{article.title}</div>
                      <div className="text-[#8899aa] text-xs mt-0.5">/blog/{article.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-0.5 bg-[#00A86B]/20 text-[#00A86B] rounded-full">
                        {article.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#8899aa]">
                      {new Date(article.created_at).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          article.published
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {article.published ? "Опубликовано" : "Черновик"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/blog/${article.slug}`}
                          target="_blank"
                          className="text-xs text-[#00A86B] hover:underline"
                        >
                          Просмотр
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#8899aa]">
                      Ничего не найдено
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-[#0f2644]/40 border border-[#243a5e] rounded-xl text-sm text-[#8899aa]">
          <p className="font-medium text-white mb-1">Как добавить статью</p>
          <p>
            Откройте файл <code className="text-[#00A86B]">lib/blog/articles.ts</code> и добавьте
            новый объект в массив <code className="text-[#00A86B]">ARTICLES</code>.
            Убедитесь что <code>published: true</code> и <code>slug</code> уникален.
            Статья появится на сайте после деплоя.
          </p>
        </div>
      </div>
    </div>
  );
}
