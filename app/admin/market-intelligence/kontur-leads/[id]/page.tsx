"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface SocialLinks {
  vk?: string;
  youtube?: string;
  telegram?: string;
  instagram?: string;
  odnoklassniki?: string;
  avito?: string;
  wildberries?: string;
  ozon?: string;
}

interface Dossier {
  collected_at: string;
  social_links: SocialLinks;
  online_presence: string;
  social_profiles_found: string;
  vk_analysis: string;
  yt_analysis: string;
  hh_analysis: string;
  buying_signals: string;
  digital_ads_found: string;
  decision_makers_online: string;
  best_outreach_channel: string;
  best_outreach_message: string;
  intelligence_summary: string;
  online_score: "A" | "B" | "C" | "D";
  hh_content: string;
  vk_content: string;
  website_content: string;
}

interface Lead {
  id: number;
  company_name: string;
  inn: string;
  region: string;
  status: string;
  revenue?: number;
  employees?: number;
  director?: string;
  position?: string;
  phone?: string;
  email?: string;
  site_url?: string;
  okvad_full?: string;
  deal_score?: string;
  deal_score_reason?: string;
  what_they_sell?: string;
  specific_skus?: string;
  price_range?: string;
  stop_factors?: string;
  pain_points?: string;
  kp_message?: string;
  supplier_search_queries?: string;
  dossier?: Dossier;
}

function fmtRevenue(r?: number) {
  if (!r) return null;
  if (r >= 1_000_000_000) return `${(r / 1_000_000_000).toFixed(1)} млрд ₽`;
  if (r >= 1_000_000) return `${Math.round(r / 1_000_000)} млн ₽`;
  return `${Math.round(r / 1000)} тыс ₽`;
}

function ScoreColor(s?: string) {
  if (s === "A") return "bg-green-700 text-white";
  if (s === "B") return "bg-blue-700 text-white";
  if (s === "C") return "bg-slate-600 text-slate-200";
  return "bg-red-900/60 text-red-300";
}

function OnlineScore({ s }: { s?: string }) {
  const map: Record<string, string> = {
    A: "🟢 Высокое (реклама, маркетплейсы)",
    B: "🔵 Среднее (соцсети есть)",
    C: "🟡 Низкое (минимум)",
    D: "🔴 Не найдены",
  };
  return <span>{map[s ?? "D"] ?? "—"}</span>;
}

function SocialBadge({ label, url, icon }: { label: string; url?: string; icon: string }) {
  if (!url) return (
    <div className="flex items-center gap-1.5 text-[10px] text-slate-600 line-through">
      <span>{icon}</span><span>{label}</span>
    </div>
  );
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 underline">
      <span>{icon}</span><span>{label}</span>
    </a>
  );
}

function Section({ title, children, accent = "slate" }: { title: string; children: React.ReactNode; accent?: string }) {
  const borders: Record<string, string> = {
    slate: "border-slate-700",
    blue: "border-blue-800",
    green: "border-green-800",
    amber: "border-amber-800",
    violet: "border-violet-800",
    red: "border-red-800",
    cyan: "border-cyan-800",
  };
  return (
    <div className={`border ${borders[accent] ?? borders.slate} rounded-xl p-4 bg-slate-900/60`}>
      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function LeadDossierPage() {
  const params = useParams();
  const id = params?.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"overview" | "social" | "hh" | "raw">("overview");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/lead-dossier?id=${id}`);
      const d = await r.json();
      if (d.ok) {
        setLead(d.lead);
        setDossier(d.dossier ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const collectDossier = async () => {
    setCollecting(true);
    setMsg("🔍 Собираю данные: сайт, VK, YouTube, HH.ru... (~30-60 сек)");
    try {
      const r = await fetch("/api/admin/lead-dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(id) }),
      });
      const d = await r.json();
      if (d.ok) {
        setDossier(d.dossier);
        setMsg("✅ Досье собрано");
      } else {
        setMsg(`❌ Ошибка: ${d.error}`);
      }
    } catch (e) {
      setMsg(`❌ Ошибка сети: ${e}`);
    }
    setCollecting(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-slate-400">Загрузка...</div>
    </div>
  );

  if (!lead) return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-red-400">Лид не найден</div>
    </div>
  );

  const revenue = fmtRevenue(lead.revenue);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin/market-intelligence/kontur-leads"
            className="text-slate-400 hover:text-white text-sm">← Воронка</Link>
          <span className="text-slate-700">/</span>
          <span className="text-white font-semibold text-sm truncate">{lead.company_name}</span>
          {lead.deal_score && (
            <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${ScoreColor(lead.deal_score)}`}>
              Лид {lead.deal_score}
            </span>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={collectDossier} disabled={collecting}
              className="text-sm bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg px-4 py-1.5">
              {collecting ? "⏳ Сбор данных..." : dossier ? "🔄 Переанализ досье" : "📋 Собрать досье"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Status bar */}
        {msg && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300">
            {msg}
          </div>
        )}

        {/* Company header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 border border-slate-700 rounded-xl p-5 bg-slate-900/60">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-white">{lead.company_name}</h1>
                <p className="text-sm text-slate-400 mt-0.5">ИНН {lead.inn} · {lead.region}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {revenue && <div className="text-lg font-bold text-amber-400">{revenue}</div>}
                {lead.employees && <div className="text-xs text-slate-500">{lead.employees} сотрудников</div>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {lead.director && (
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Директор</p>
                  <p className="text-slate-200">{lead.director}</p>
                  {lead.position && <p className="text-[10px] text-slate-500">{lead.position}</p>}
                </div>
              )}
              {lead.phone && (
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Телефон</p>
                  <a href={`tel:${lead.phone}`} className="text-blue-400 hover:text-blue-300">{lead.phone}</a>
                </div>
              )}
              {lead.email && (
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Email</p>
                  <a href={`mailto:${lead.email}`} className="text-blue-400 hover:text-blue-300">{lead.email}</a>
                </div>
              )}
              {lead.site_url && (
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Сайт</p>
                  <a href={lead.site_url} target="_blank" rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs truncate block">{lead.site_url}</a>
                </div>
              )}
            </div>
            {lead.okvad_full && (
              <p className="text-[10px] text-slate-500 mt-3 border-t border-slate-800 pt-2">{lead.okvad_full}</p>
            )}
          </div>

          {/* Quick stats */}
          <div className="space-y-3">
            {lead.deal_score_reason && (
              <div className="border border-slate-700 rounded-xl p-3 bg-slate-900/60">
                <p className="text-[9px] text-slate-500 uppercase mb-1">Deal Score {lead.deal_score}</p>
                <p className="text-[11px] text-slate-300">{lead.deal_score_reason}</p>
              </div>
            )}
            {dossier && (
              <div className="border border-violet-800/50 rounded-xl p-3 bg-violet-950/20">
                <p className="text-[9px] text-violet-400 uppercase mb-1">Онлайн-присутствие</p>
                <p className="text-[11px] text-slate-300"><OnlineScore s={dossier.online_score} /></p>
                <p className="text-[10px] text-slate-400 mt-1">{dossier.online_presence}</p>
                <p className="text-[9px] text-slate-600 mt-2">
                  Обновлено: {new Date(dossier.collected_at).toLocaleString("ru-RU")}
                </p>
              </div>
            )}
          </div>
        </div>

        {!dossier ? (
          <div className="border border-dashed border-slate-700 rounded-xl p-10 text-center">
            <p className="text-slate-400 text-lg mb-2">📋 Досье не собрано</p>
            <p className="text-slate-600 text-sm mb-4">Нажми «Собрать досье» чтобы запустить разведку:<br/>сайт (глубокий краул), VK, YouTube, HH.ru, 2GIS</p>
            <button onClick={collectDossier} disabled={collecting}
              className="bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg px-6 py-2">
              {collecting ? "⏳ Идёт сбор..." : "📋 Собрать досье"}
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-800">
              {[
                { key: "overview", label: "🧠 Разведка" },
                { key: "social", label: "📱 Соцсети" },
                { key: "hh", label: "💼 HH.ru" },
                { key: "raw", label: "📄 Сырые данные" },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
                  className={`px-4 py-2 text-sm rounded-t ${tab === t.key ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {tab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Section title="🎯 Сигналы закупочной активности" accent="green">
                  <p className="text-[12px] text-green-300 leading-relaxed">{dossier.buying_signals}</p>
                </Section>

                <Section title="📢 Цифровая реклама" accent="amber">
                  <p className="text-[12px] text-amber-300 leading-relaxed">{dossier.digital_ads_found}</p>
                </Section>

                <Section title="👤 ЛПРы в онлайне" accent="blue">
                  <p className="text-[12px] text-blue-300 leading-relaxed">{dossier.decision_makers_online}</p>
                </Section>

                <Section title="📨 Лучший канал для выхода" accent="cyan">
                  <p className="text-[11px] font-bold text-cyan-400 mb-2">{dossier.best_outreach_channel}</p>
                  <div className="bg-slate-800 rounded p-2">
                    <p className="text-[10px] text-slate-500 mb-1">Готовое сообщение:</p>
                    <p className="text-[11px] text-slate-200 leading-relaxed">{dossier.best_outreach_message}</p>
                  </div>
                </Section>

                <div className="md:col-span-2">
                  <Section title="🔍 Полный разведывательный отчёт" accent="violet">
                    <p className="text-[12px] text-slate-200 leading-relaxed whitespace-pre-wrap">{dossier.intelligence_summary}</p>
                  </Section>
                </div>

                {lead.specific_skus && (
                  <div className="md:col-span-2">
                    <Section title="📦 SKU + Цены (для поиска поставщика)" accent="amber">
                      <p className="text-[11px] text-amber-200 whitespace-pre-wrap leading-5">{lead.specific_skus}</p>
                      {lead.supplier_search_queries && (
                        <div className="mt-3 pt-3 border-t border-slate-800">
                          <p className="text-[9px] text-violet-400 uppercase mb-1">Запросы для 1688/Accio</p>
                          <p className="text-[10px] text-violet-200 font-mono">{lead.supplier_search_queries}</p>
                        </div>
                      )}
                    </Section>
                  </div>
                )}

                {lead.stop_factors && (
                  <Section title="⛔ Стоп-факторы" accent="red">
                    <p className="text-[12px] text-red-300">{lead.stop_factors}</p>
                  </Section>
                )}

                {lead.kp_message && (
                  <Section title="📬 КП — WhatsApp/Telegram" accent="green">
                    <div className="bg-green-950/30 rounded p-3">
                      <p className="text-[12px] text-green-200 leading-relaxed whitespace-pre-wrap">{lead.kp_message}</p>
                    </div>
                  </Section>
                )}
              </div>
            )}

            {/* Social tab */}
            {tab === "social" && (
              <div className="space-y-4">
                {/* Social links grid */}
                <div className="border border-slate-700 rounded-xl p-4 bg-slate-900/60">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Найденные профили</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <SocialBadge label="ВКонтакте" url={dossier.social_links?.vk} icon="🔵" />
                    <SocialBadge label="YouTube" url={dossier.social_links?.youtube} icon="🔴" />
                    <SocialBadge label="Telegram" url={dossier.social_links?.telegram} icon="💬" />
                    <SocialBadge label="Instagram" url={dossier.social_links?.instagram} icon="📸" />
                    <SocialBadge label="Одноклассники" url={dossier.social_links?.odnoklassniki} icon="🟠" />
                    <SocialBadge label="Avito" url={dossier.social_links?.avito} icon="🟢" />
                    <SocialBadge label="Wildberries" url={dossier.social_links?.wildberries} icon="🍇" />
                    <SocialBadge label="Ozon" url={dossier.social_links?.ozon} icon="🔷" />
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500">Все найденные: {dossier.social_profiles_found}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Section title="🔵 ВКонтакте" accent="blue">
                    <p className="text-[12px] text-slate-300 leading-relaxed">{dossier.vk_analysis}</p>
                  </Section>
                  <Section title="🔴 YouTube" accent="red">
                    <p className="text-[12px] text-slate-300 leading-relaxed">{dossier.yt_analysis}</p>
                  </Section>
                </div>
              </div>
            )}

            {/* HH tab */}
            {tab === "hh" && (
              <div className="space-y-4">
                <Section title="💼 Анализ вакансий (HH.ru)" accent="amber">
                  <p className="text-[12px] text-amber-200 leading-relaxed">{dossier.hh_analysis}</p>
                </Section>
                {dossier.hh_content && (
                  <Section title="Сырые данные HH.ru" accent="slate">
                    <pre className="text-[10px] text-slate-400 whitespace-pre-wrap overflow-auto max-h-96">{dossier.hh_content}</pre>
                  </Section>
                )}
              </div>
            )}

            {/* Raw tab */}
            {tab === "raw" && (
              <div className="space-y-4">
                {dossier.website_content && (
                  <Section title="Контент сайта (Firecrawl)" accent="slate">
                    <pre className="text-[10px] text-slate-400 whitespace-pre-wrap overflow-auto max-h-96">{dossier.website_content}</pre>
                  </Section>
                )}
                {dossier.vk_content && (
                  <Section title="VK Search" accent="blue">
                    <pre className="text-[10px] text-slate-400 whitespace-pre-wrap overflow-auto max-h-64">{dossier.vk_content}</pre>
                  </Section>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
