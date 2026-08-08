"use client";
import { useState, useEffect, useCallback } from "react";

interface PaymentLink {
  id: number;
  operation_id: string;
  amount: string | number;
  purpose: string;
  payment_link: string;
  status: string;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  CREATED:  "bg-amber-500/10  text-amber-400  border-amber-500/30",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  DECLINED: "bg-red-500/10    text-red-400    border-red-500/30",
  EXPIRED:  "bg-slate-700/50  text-slate-500  border-slate-600",
};

const STATUS_LABEL: Record<string, string> = {
  CREATED:  "Создан",
  APPROVED: "Оплачен",
  DECLINED: "Отклонён",
  EXPIRED:  "Истёк",
};

function fmtDate(dt: string) {
  try { return new Date(dt).toLocaleString("ru-RU"); } catch { return dt; }
}

function fmtAmount(v: string | number) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("ru-RU") : String(v);
}

export function TochkaLinksSection() {
  const [links,   setLinks]   = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [amount,  setAmount]  = useState("");
  const [purpose, setPurpose] = useState("");
  const [notice,  setNotice]  = useState<{ text: string; ok: boolean } | null>(null);
  const [copied,  setCopied]  = useState<number | null>(null);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/payments/tochka");
      const data = await res.json() as { ok: boolean; links?: PaymentLink[] };
      if (data.ok && data.links) setLinks(data.links);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount.replace(",", "."));
    if (!amt || amt <= 0) {
      setNotice({ text: "Укажите корректную сумму", ok: false });
      return;
    }
    if (!purpose.trim()) {
      setNotice({ text: "Укажите назначение платежа", ok: false });
      return;
    }

    setCreating(true);
    setNotice(null);
    try {
      const res  = await fetch("/api/payments/tochka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, purpose: purpose.trim() }),
      });
      const data = await res.json() as { ok: boolean; paymentLink?: string; operationId?: string; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Ошибка создания");

      setNotice({ text: `Ссылка создана: ${data.paymentLink}`, ok: true });
      setAmount("");
      setPurpose("");
      setShowForm(false);
      await loadLinks();
    } catch (err) {
      setNotice({ text: String(err), ok: false });
    } finally {
      setCreating(false);
    }
  }

  async function copyLink(link: PaymentLink) {
    try {
      await navigator.clipboard.writeText(link.payment_link);
      setCopied(link.id);
      setTimeout(() => setCopied((c) => (c === link.id ? null : c)), 1500);
    } catch {}
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">🔗 Платёжные ссылки (Точка)</h3>
        <button
          onClick={() => { setShowForm((v) => !v); setNotice(null); }}
          className="text-xs px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition font-medium"
        >
          {showForm ? "Отмена" : "+ Создать ссылку для клиента"}
        </button>
      </div>

      {/* Notice */}
      {notice && (
        <div className={`mb-4 p-3 rounded-lg border text-xs leading-relaxed break-all ${notice.ok ? "bg-green-900/20 border-green-700 text-green-300" : "bg-red-900/20 border-red-700 text-red-300"}`}>
          {notice.text}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-5 p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Сумма, ₽</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Например: 29900"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-600/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Назначение</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="ChinaBridge Pro — 1 месяц"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-600/50"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
          >
            {creating ? "Создаём..." : "Создать платёжную ссылку"}
          </button>
        </form>
      )}

      {/* Links table */}
      {loading ? (
        <p className="text-slate-500 text-sm text-center py-4">Загрузка...</p>
      ) : links.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-4">Ссылок ещё нет. Создайте первую.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-400 text-xs">Назначение</th>
                <th className="px-3 py-2 text-right font-medium text-slate-400 text-xs">Сумма</th>
                <th className="px-3 py-2 text-center font-medium text-slate-400 text-xs">Статус</th>
                <th className="px-3 py-2 text-right font-medium text-slate-400 text-xs">Дата</th>
                <th className="px-3 py-2 text-center font-medium text-slate-400 text-xs">Ссылка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-3 py-2.5 text-white max-w-[200px] truncate" title={link.purpose}>
                    {link.purpose}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-white">
                    {fmtAmount(link.amount)} ₽
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[link.status] ?? "bg-slate-800 text-slate-400 border-slate-700"}`}>
                      {STATUS_LABEL[link.status] ?? link.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-500 text-xs whitespace-nowrap">
                    {fmtDate(link.created_at)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => copyLink(link)}
                      className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition whitespace-nowrap"
                    >
                      {copied === link.id ? "Скопировано" : "Копировать"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
