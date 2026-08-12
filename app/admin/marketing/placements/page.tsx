"use client";

import { useState, useEffect, useCallback } from "react";

type PostType = "закреп" | "временный" | "постоянный";
type ChannelType = "канал" | "чат" | "группа";

interface Placement {
  id: number;
  name: string;
  username: string | null;
  channel_type: ChannelType;
  post_type: PostType;
  duration_hours: number | null;
  placed_at: string;
  expires_at: string | null;
  cost_rub: number | null;
  notes: string | null;
}

const POST_TYPE_COLORS: Record<PostType, string> = {
  закреп:     "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  временный:  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  постоянный: "bg-green-500/20 text-green-300 border-green-500/30",
};

const DURATION_PRESETS = [
  { label: "1 ч", hours: 1 },
  { label: "3 ч", hours: 3 },
  { label: "6 ч", hours: 6 },
  { label: "12 ч", hours: 12 },
  { label: "24 ч", hours: 24 },
  { label: "48 ч", hours: 48 },
  { label: "7 дн", hours: 168 },
];

function timeLeft(expiresAt: string | null): string {
  if (!expiresAt) return "";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "истёк";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}ч ${m}м` : `${m}м`;
}

function isExpired(p: Placement) {
  return p.expires_at && new Date(p.expires_at) < new Date();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function PlacementsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [tick, setTick] = useState(0);

  // form state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [channelType, setChannelType] = useState<ChannelType>("канал");
  const [postType, setPostType] = useState<PostType>("временный");
  const [durationHours, setDurationHours] = useState<number | null>(24);
  const [costRub, setCostRub] = useState("");
  const [notes, setNotes] = useState("");
  const [placedAt, setPlacedAt] = useState(() =>
    new Date().toISOString().slice(0, 16)
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/marketing/placements");
      if (!res.ok) throw new Error(await res.text());
      setPlacements(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const placed = new Date(placedAt).toISOString();
      const expires = postType === "временный" && durationHours
        ? new Date(new Date(placedAt).getTime() + durationHours * 3_600_000).toISOString()
        : null;

      const res = await fetch("/api/marketing/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim() || null,
          channel_type: channelType,
          post_type: postType,
          duration_hours: postType === "временный" ? durationHours : null,
          placed_at: placed,
          expires_at: expires,
          cost_rub: costRub ? parseInt(costRub, 10) : null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      setName(""); setUsername(""); setNotes(""); setCostRub("");
      setChannelType("канал"); setPostType("временный"); setDurationHours(24);
      setPlacedAt(new Date().toISOString().slice(0, 16));
      setShowForm(false);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Удалить это размещение?")) return;
    await fetch(`/api/marketing/placements?id=${id}`, { method: "DELETE" });
    await load();
  }

  const active = placements.filter(p => !isExpired(p));
  const expired = placements.filter(p => isExpired(p));
  const totalSpend = placements.reduce((s, p) => s + (p.cost_rub ?? 0), 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Размещения</h1>
          <p className="text-slate-400 text-sm mt-0.5">Реклама в Telegram-каналах и чатах</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
        >
          {showForm ? "Отмена" : "+ Добавить"}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Активных", value: active.length, color: "text-green-400" },
          { label: "Истёкших", value: expired.length, color: "text-slate-500" },
          { label: "Всего", value: placements.length, color: "text-white" },
          { label: "Расходы ₽", value: totalSpend.toLocaleString("ru"), color: "text-yellow-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-slate-400 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-slate-800 rounded-xl p-5 border border-slate-700 space-y-4">
          <h2 className="text-white font-semibold">Новое размещение</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Название канала / чата *</label>
              <input
                required value={name} onChange={e => setName(e.target.value)}
                placeholder="Маркетплейс Казахстан"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Username (@handle)</label>
              <input
                value={username} onChange={e => setUsername(e.target.value)}
                placeholder="@kaspi_kz"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Тип площадки</label>
              <select
                value={channelType} onChange={e => setChannelType(e.target.value as ChannelType)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              >
                <option>канал</option>
                <option>чат</option>
                <option>группа</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Тип поста</label>
              <select
                value={postType} onChange={e => setPostType(e.target.value as PostType)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              >
                <option>временный</option>
                <option>закреп</option>
                <option>постоянный</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Стоимость ₽</label>
              <input
                type="number" min="0" value={costRub} onChange={e => setCostRub(e.target.value)}
                placeholder="600"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {postType === "временный" && (
            <div>
              <label className="block text-slate-400 text-xs mb-2">Длительность поста</label>
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map(p => (
                  <button
                    key={p.hours} type="button"
                    onClick={() => setDurationHours(p.hours)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      durationHours === p.hours
                        ? "bg-red-600 border-red-500 text-white"
                        : "border-slate-600 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Дата и время размещения</label>
              <input
                type="datetime-local" value={placedAt} onChange={e => setPlacedAt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Заметки</label>
              <input
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="CPM 600₽, 15 000 подписчиков..."
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit" disabled={saving}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
          >
            {saving ? "Сохраняю..." : "Сохранить"}
          </button>
        </form>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center text-slate-500 py-12">Загрузка...</div>
      )}

      {/* Active placements */}
      {!loading && active.length > 0 && (
        <div>
          <h2 className="text-slate-300 text-sm font-semibold mb-3">Активные ({active.length})</h2>
          <div className="space-y-3">
            {active.map(p => (
              <PlacementCard key={p.id} p={p} tick={tick} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Expired placements */}
      {!loading && expired.length > 0 && (
        <div>
          <h2 className="text-slate-500 text-sm font-semibold mb-3">Истёкшие ({expired.length})</h2>
          <div className="space-y-3 opacity-60">
            {expired.map(p => (
              <PlacementCard key={p.id} p={p} tick={tick} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && placements.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-3">📌</div>
          <p>Нет размещений. Добавьте первое!</p>
        </div>
      )}
    </div>
  );
}

function PlacementCard({
  p, tick, onDelete,
}: {
  p: Placement;
  tick: number;
  onDelete: (id: number) => void;
}) {
  void tick;
  const left = timeLeft(p.expires_at);
  const expired = isExpired(p);

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-medium">{p.name}</span>
          {p.username && (
            <a
              href={`https://t.me/${p.username.replace("@", "")}`}
              target="_blank" rel="noreferrer"
              className="text-blue-400 text-xs hover:underline"
            >
              {p.username.startsWith("@") ? p.username : `@${p.username}`}
            </a>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs border ${POST_TYPE_COLORS[p.post_type]}`}>
            {p.post_type}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs border border-slate-600 text-slate-400">
            {p.channel_type}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
          <span>📅 {formatDate(p.placed_at)}</span>
          {p.cost_rub != null && <span>💰 {p.cost_rub.toLocaleString("ru")} ₽</span>}
          {p.expires_at && !expired && (
            <span className="text-amber-400">⏱ {left}</span>
          )}
          {expired && <span className="text-slate-600">Истёк</span>}
          {p.notes && <span className="text-slate-500 truncate max-w-xs">{p.notes}</span>}
        </div>
      </div>

      <button
        onClick={() => onDelete(p.id)}
        className="text-slate-600 hover:text-red-400 transition text-lg shrink-0"
        title="Удалить"
      >
        ×
      </button>
    </div>
  );
}
