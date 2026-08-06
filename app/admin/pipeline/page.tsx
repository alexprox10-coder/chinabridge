"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_EMOJI } from "@/lib/crm/types";
import type { CRMLead, LeadStatus } from "@/lib/crm/types";

const COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: "NEW",         label: "Новый",       color: "border-blue-500/30" },
  { status: "CONTACTED",   label: "Связались",   color: "border-cyan-500/30" },
  { status: "QUALIFICATION", label: "Квалификация", color: "border-purple-500/30" },
  { status: "CALCULATION", label: "Расчёт",      color: "border-yellow-500/30" },
  { status: "OFFER_SENT",  label: "КП",          color: "border-orange-500/30" },
  { status: "NEGOTIATION", label: "Переговоры",  color: "border-indigo-500/30" },
  { status: "PAYMENT",     label: "Оплата",      color: "border-emerald-500/30" },
  { status: "DELIVERY",    label: "Доставка",    color: "border-teal-500/30" },
  { status: "SUCCESS",     label: "Сделка",      color: "border-green-500/30" },
  { status: "LOST",        label: "Отказ",       color: "border-red-500/30" },
];

function msAgo(iso: string) {
  return Date.now() - new Date(iso || 0).getTime();
}

function timeLabel(iso: string) {
  const ms = msAgo(iso);
  const h = Math.floor(ms / 3600000);
  if (h < 1) return "только что";
  if (h < 24) return `${h}ч назад`;
  const d = Math.floor(h / 24);
  return `${d}д назад`;
}

function LeadCard({
  lead,
  onDragStart,
  onDelete,
}: {
  lead: CRMLead;
  onDragStart: (e: React.DragEvent, lead: CRMLead) => void;
  onDelete: (id: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const isStale = lead.status === "NEW" && msAgo(lead.created_at) > 24 * 3600000;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/admin/leads/${lead.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({ ok: false }));
      if (data.ok) onDelete(lead.id!);
    } finally { setDeleting(false); }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      className={`bg-slate-900 border rounded-lg p-3 cursor-grab active:cursor-grabbing select-none hover:border-slate-600 transition ${
        isStale ? "border-amber-500/40" : "border-slate-800"
      }`}
    >
      <div className="flex items-start justify-between gap-1 mb-2">
        <Link
          href={`/admin/leads/${lead.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-white text-sm hover:text-red-400 transition truncate"
        >
          {lead.name || "—"}
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-base">{PRIORITY_EMOJI[(lead.priority ?? "COLD") as keyof typeof PRIORITY_EMOJI]}</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Удалить лид"
            className="p-1 rounded text-slate-700 hover:text-red-400 hover:bg-red-900/20 transition disabled:opacity-40">
            {deleting ? "⏳" : "🗑"}
          </button>
        </div>
      </div>

      {lead.product && (
        <p className="text-slate-500 text-xs mb-2 truncate">{lead.product}</p>
      )}

      <div className="flex flex-wrap gap-1 text-xs mb-2">
        {lead.weight && (
          <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{lead.weight}</span>
        )}
        {lead.delivery_cost != null && (
          <span className="bg-slate-800 text-green-400 px-1.5 py-0.5 rounded">
            ${Number(lead.delivery_cost).toLocaleString()}
          </span>
        )}
        {lead.margin_percent != null && (
          <span className="bg-slate-800 text-yellow-400 px-1.5 py-0.5 rounded">
            {lead.margin_percent}%
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 truncate">
          {[lead.city_destination, lead.country_destination].filter(Boolean).join(", ") || "—"}
        </span>
        <span className={`text-slate-500 shrink-0 ${isStale ? "text-amber-400" : ""}`}>
          {timeLabel(lead.created_at)}
        </span>
      </div>

      {lead.phone && (
        <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-slate-500 truncate">
          {lead.phone}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  col,
  leads,
  onDragStart,
  onDrop,
  onDragOver,
  onDragLeave,
  onDelete,
  isOver,
}: {
  col: (typeof COLUMNS)[0];
  leads: CRMLead[];
  onDragStart: (e: React.DragEvent, lead: CRMLead) => void;
  onDrop: (e: React.DragEvent, status: LeadStatus) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDelete: (id: number) => void;
  isOver: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border min-w-[220px] w-[220px] shrink-0 transition ${col.color} ${
        isOver ? "bg-slate-800/40 scale-[1.01]" : "bg-slate-900/60"
      }`}
      onDrop={(e) => onDrop(e, col.status)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <div className="px-3 py-2.5 border-b border-slate-800/60 flex items-center justify-between shrink-0">
        <span className="text-sm font-medium text-white">{col.label}</span>
        <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">{leads.length}</span>
      </div>
      <div className="flex flex-col gap-2 p-2 overflow-y-auto flex-1 min-h-[80px] max-h-[calc(100vh-220px)]">
        {leads.map((l) => (
          <LeadCard key={l.id} lead={l} onDragStart={onDragStart} onDelete={onDelete} />
        ))}
        {leads.length === 0 && (
          <div className="text-slate-700 text-xs text-center py-4">Пусто</div>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [overCol, setOverCol] = useState<LeadStatus | null>(null);
  const draggedLead = useRef<CRMLead | null>(null);

  useEffect(() => {
    fetch("/api/admin/leads", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setLeads(Array.isArray(data) ? data : (data.leads ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, lead: CRMLead) => {
    draggedLead.current = lead;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    setOverCol(null);
    const lead = draggedLead.current;
    if (!lead || lead.status === status) return;

    // Optimistic update
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));

    try {
      await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      // Revert on error
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l)));
    }
    draggedLead.current = null;
  }, []);

  const handleDelete = useCallback((id: number) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  }, []);

  const byStatus = (status: LeadStatus) => leads.filter((l) => l.status === status);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <AdminNav />
      <main className="flex-1 flex flex-col px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Pipeline</h1>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{leads.length} лидов</span>
            <button
              onClick={() => { setLoading(true); fetch("/api/admin/leads", { cache: "no-store" }).then((r) => r.json()).then((d) => setLeads(Array.isArray(d) ? d : (d.leads ?? []))).finally(() => setLoading(false)); }}
              className="text-slate-400 hover:text-white transition"
            >
              ↻ Обновить
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1 text-slate-500">Загрузка лидов…</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.status}
                col={col}
                leads={byStatus(col.status)}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDragOver={(e) => { handleDragOver(e); setOverCol(col.status); }}
                onDragLeave={() => setOverCol(null)}
                onDelete={handleDelete}
                isOver={overCol === col.status}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
