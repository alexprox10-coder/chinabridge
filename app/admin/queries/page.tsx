"use client";

import { useEffect, useState } from "react";

interface ProductRow { product?: string; product_name?: string; cnt: string; }
interface CategoryRow { category: string; cnt: string; }
interface RecentRow { product?: string; product_name?: string; category?: string; source?: string; created_at: string; }

interface LeadsData {
  ok: boolean;
  total: number;
  by_product: ProductRow[];
  by_category: CategoryRow[];
  recent: RecentRow[];
}

interface SearchData {
  ok: boolean;
  total_14d: number;
  top_products: ProductRow[];
  top_categories: CategoryRow[];
  recent: RecentRow[];
}

const CAT_LABELS: Record<string, string> = {
  electronics: "Электроника",
  clothing: "Одежда",
  auto_parts: "Автозапчасти",
  furniture: "Мебель",
  lighting: "Освещение",
  equipment: "Оборудование",
  toys: "Игрушки",
  packaging: "Упаковка",
  cosmetics: "Косметика",
  home_goods: "Товары для дома",
  other: "Прочее",
  import_audit: "Импорт Аудит",
  "": "Без категории",
};

function fmt(s: string) {
  try {
    return new Date(s).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return s; }
}

function isJunk(s: string) {
  return !s || s === "x" || s.startsWith("Нажал на номер") || s.startsWith("http") || s.startsWith("Тест");
}

export default function QueriesPage() {
  const [leads, setLeads] = useState<LeadsData | null>(null);
  const [searches, setSearches] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/leads-products").then(r => r.json()),
      fetch("/api/admin/calc-searches").then(r => r.json()).catch(() => ({ ok: false })),
    ]).then(([l, s]) => {
      setLeads(l);
      setSearches(s);
      setLoading(false);
    });
  }, []);

  const cleanLeads = leads?.by_product.filter(r => !isJunk(r.product ?? "")) ?? [];
  const recentClean = leads?.recent.filter(r => !isJunk(r.product ?? "")) ?? [];

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Запросы и Целевая аудитория</h1>
        <p className="text-slate-400 text-sm">Что ищут посетители сайта · ВКонтакте ретаргетинг</p>
      </div>

      {loading && (
        <div className="text-slate-500 text-sm animate-pulse">Загружаем данные...</div>
      )}

      {/* ─── Анонимные поиски (calc_searches) ─── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          🔍 Анонимные поиски в калькуляторе
          {searches?.total_14d !== undefined && (
            <span className="text-xs font-normal bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full ml-1">
              {searches.total_14d} за 14 дней
            </span>
          )}
        </h2>
        {searches?.ok === false || (searches?.total_14d === 0 && !loading) ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 text-center">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-slate-300 font-medium">Данные ещё накапливаются</div>
            <div className="text-slate-500 text-sm mt-1">
              Логирование запущено сегодня. Через 1–2 недели здесь появится статистика
              по товарам которые посетители вводят в калькулятор.
            </div>
          </div>
        ) : searches && searches.total_14d > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-3">Топ товаров</div>
              <div className="space-y-2">
                {searches.top_products.slice(0, 15).map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-slate-600 text-xs w-5 text-right">{i + 1}</span>
                    <div className="flex-1 text-slate-200 text-sm truncate">{r.product_name ?? r.product}</div>
                    <span className="text-slate-500 text-xs bg-slate-900 px-2 py-0.5 rounded-full">{r.cnt}×</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-3">По категориям</div>
              <div className="space-y-2">
                {searches.top_categories.map((r, i) => {
                  const total = searches.top_categories.reduce((s, x) => s + parseInt(x.cnt), 0);
                  const pct = Math.round(parseInt(r.cnt) / total * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-slate-300">{CAT_LABELS[r.category] ?? r.category}</span>
                        <span className="text-slate-500">{r.cnt} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* ─── Лиды с товаром из CRM ─── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          📋 Товары из оставленных заявок
          {leads?.total !== undefined && (
            <span className="text-xs font-normal bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full ml-1">
              {cleanLeads.reduce((s, r) => s + parseInt(r.cnt), 0)} чистых заявок
            </span>
          )}
        </h2>
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-3">Топ товаров</div>
              {cleanLeads.length === 0 ? (
                <div className="text-slate-500 text-sm">Нет данных</div>
              ) : (
                <div className="space-y-2">
                  {cleanLeads.slice(0, 15).map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-slate-600 text-xs w-5 text-right">{i + 1}</span>
                      <div className="flex-1 text-slate-200 text-sm truncate">{r.product ?? r.product_name}</div>
                      <span className="text-slate-500 text-xs bg-slate-900 px-2 py-0.5 rounded-full">{r.cnt}×</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-3">Последние заявки с товаром</div>
              <div className="space-y-2">
                {recentClean.slice(0, 12).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 border-b border-slate-700/50 pb-1.5 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-200 text-sm truncate">{r.product ?? r.product_name}</div>
                      <div className="text-slate-600 text-xs">{fmt(r.created_at)}</div>
                    </div>
                    {r.source && (
                      <span className="text-slate-600 text-xs shrink-0 bg-slate-900 px-1.5 rounded">
                        {r.source.replace("LEAD_MAGNET_", "").replace("_", " ").toLowerCase()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─── ВКонтакте Ретаргетинг ─── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">🎯 Целевая аудитория ВКонтакте</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Статус пикселя */}
          <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-medium text-sm">VK Pixel активен</span>
              <span className="text-emerald-600 text-xs ml-auto">ID: 3787763</span>
            </div>
            <div className="space-y-1.5 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>Пиксель установлен на всём сайте</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>Аудитория посетителей калькулятора собирается</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>События по категориям товаров передаются</span>
              </div>
            </div>
          </div>

          {/* Как создать аудиторию */}
          <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-4">
            <div className="text-blue-300 font-medium text-sm mb-3">📌 Как создать аудиторию</div>
            <ol className="space-y-1.5 text-sm text-slate-300 list-none">
              <li className="flex gap-2"><span className="text-blue-500 font-bold shrink-0">1.</span> ВКонтакте Реклама → <span className="text-white">Аудитории</span></li>
              <li className="flex gap-2"><span className="text-blue-500 font-bold shrink-0">2.</span> Создать аудиторию → <span className="text-white">Пиксель</span></li>
              <li className="flex gap-2"><span className="text-blue-500 font-bold shrink-0">3.</span> Выбрать пиксель <span className="text-blue-300 font-mono text-xs">3787763</span></li>
              <li className="flex gap-2"><span className="text-blue-500 font-bold shrink-0">4.</span> URL содержит: <span className="text-white font-mono text-xs">/calculator</span> или <span className="text-white font-mono text-xs">/ai-calculator</span></li>
              <li className="flex gap-2"><span className="text-blue-500 font-bold shrink-0">5.</span> Период: <span className="text-white">последние 30 дней</span></li>
            </ol>
          </div>
        </div>

        {/* VK Event Goals */}
        <div className="mt-4 bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-slate-400 text-xs uppercase tracking-wide mb-3">Events передаются в VK Pixel по категориям товаров</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {[
              { goal: "calc_search_electronics",  label: "Электроника",   emoji: "📱" },
              { goal: "calc_search_clothing",     label: "Одежда",        emoji: "👕" },
              { goal: "calc_search_auto_parts",   label: "Автозапчасти",  emoji: "🔧" },
              { goal: "calc_search_furniture",    label: "Мебель",        emoji: "🛋" },
              { goal: "calc_search_lighting",     label: "Освещение",     emoji: "💡" },
              { goal: "calc_search_equipment",    label: "Оборудование",  emoji: "⚙️" },
              { goal: "calc_search_toys",         label: "Игрушки",       emoji: "🧸" },
              { goal: "calc_search_packaging",    label: "Упаковка",      emoji: "📦" },
              { goal: "calc_search_cosmetics",    label: "Косметика",     emoji: "💄" },
              { goal: "calc_search_home_goods",   label: "Дом/Кухня",     emoji: "🏠" },
            ].map(({ goal, label, emoji }) => (
              <div key={goal} className="bg-slate-900 rounded-lg p-2.5 text-center">
                <div className="text-xl mb-1">{emoji}</div>
                <div className="text-slate-200 text-xs font-medium">{label}</div>
                <div className="text-slate-600 text-[10px] mt-0.5 font-mono truncate">{goal}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-slate-500 text-xs">
            Для каждой категории можно создать отдельную аудиторию в VK Ads через <span className="text-slate-400">«Событие пикселя»</span> и запустить рекламу с конкретным товарным оффером.
          </div>
        </div>
      </section>
    </div>
  );
}
