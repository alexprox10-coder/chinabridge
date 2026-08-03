"use client";
import { useState, useEffect, useCallback } from "react";
import type { FinanceOrder, FinancePayment, FinanceExpense } from "@/lib/finance/types";
import {
  CURRENCY_SYMBOLS,
  CURRENCIES,
  EXPENSE_CATEGORIES,
  PAYMENT_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  calcFinancials,
} from "@/lib/finance/types";

const inp = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition";
const sel = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition";

interface Props {
  leadId: string;
  leadName: string;
  manager?: string;
}

const EMPTY_ORDER: Partial<FinanceOrder> = {
  currency: "USD",
  goods_cost: 0,
  delivery_cost: 0,
  services_cost: 0,
  bank_fee: 0,
  customs_cost: 0,
  other_expenses: 0,
  client_price: 0,
  notes: "",
};

export function FinanceTab({ leadId, leadName, manager = "" }: Props) {
  const [order, setOrder] = useState<FinanceOrder | null>(null);
  const [form, setForm] = useState<Partial<FinanceOrder>>(EMPTY_ORDER);
  const [payments, setPayments] = useState<FinancePayment[]>([]);
  const [expenses, setExpenses] = useState<FinanceExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"costs" | "payments" | "expenses">("costs");
  const [addPayment, setAddPayment] = useState(false);
  const [addExpense, setAddExpense] = useState(false);
  const [payForm, setPayForm] = useState({ type: "prepayment", amount: "", currency: "USD", payment_date: "", payment_method: "", status: "pending", comment: "" });
  const [expForm, setExpForm] = useState({ category: "Доставка", amount: "", currency: "USD", expense_date: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, pRes, eRes] = await Promise.all([
        fetch(`/api/admin/finance/orders?lead_id=${leadId}`),
        fetch(`/api/admin/finance/payments?lead_id=${leadId}`),
        fetch(`/api/admin/finance/expenses?lead_id=${leadId}`),
      ]);
      const [od, pd, ed] = await Promise.all([oRes.json(), pRes.json(), eRes.json()]);
      const existing = od.orders?.[0] ?? null;
      setOrder(existing);
      setForm(existing ? { ...existing } : { ...EMPTY_ORDER });
      setPayments(pd.payments ?? []);
      setExpenses(ed.expenses ?? []);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { load(); }, [load]);

  const computed = calcFinancials(form);
  const sym = CURRENCY_SYMBOLS[form.currency as keyof typeof CURRENCY_SYMBOLS] ?? "$";
  const clientPrice = Number(form.client_price) || 0;

  function setF(key: keyof FinanceOrder, val: string | number) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function saveOrder() {
    setSaving(true);
    setSaved(false);
    try {
      if (order?.id) {
        await fetch(`/api/admin/finance/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        const res = await fetch("/api/admin/finance/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, lead_id: leadId, client_name: leadName, manager }),
        });
        const data = await res.json();
        setOrder(data.order ?? null);
      }
      setSaved(true);
      setTimeout(() => { setSaved(false); load(); }, 1500);
    } finally {
      setSaving(false);
    }
  }

  async function savePayment() {
    await fetch("/api/admin/finance/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payForm, amount: Number(payForm.amount), lead_id: leadId, finance_order_id: order?.id ?? "", client_name: leadName }),
    });
    setAddPayment(false);
    setPayForm({ type: "prepayment", amount: "", currency: "USD", payment_date: "", payment_method: "", status: "pending", comment: "" });
    load();
  }

  async function saveExpense() {
    await fetch("/api/admin/finance/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...expForm, amount: Number(expForm.amount), lead_id: leadId, finance_order_id: order?.id ?? "" }),
    });
    setAddExpense(false);
    setExpForm({ category: "Доставка", amount: "", currency: "USD", expense_date: "", description: "" });
    load();
  }

  async function markPayment(id: number, status: string) {
    await fetch(`/api/admin/finance/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  if (loading) return (
    <div className="text-slate-500 text-sm text-center py-12">Загрузка финансовых данных...</div>
  );

  const totalPaid    = payments.filter((p) => p.status === "paid").reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + (p.amount ?? 0), 0);
  const maxBar       = Math.max(clientPrice, computed.total_cost, 1);

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1.5">
        {(["costs", "payments", "expenses"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${tab === t ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30" : "text-slate-500 hover:text-white"}`}
          >
            {t === "costs" ? "💰 Экономика" : t === "payments" ? "💳 Платежи" : "💸 Расходы"}
          </button>
        ))}
      </div>

      {/* === COSTS TAB === */}
      {tab === "costs" && (
        <div className="space-y-5">
          {/* Summary bar chart */}
          {(clientPrice > 0 || computed.total_cost > 0) && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
              {[
                { label: "Получено", value: clientPrice,          color: "bg-blue-500" },
                { label: "Расходы",  value: computed.total_cost,  color: "bg-red-500/70" },
                { label: "Прибыль",  value: computed.gross_profit, color: computed.gross_profit >= 0 ? "bg-emerald-500" : "bg-red-500" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{label}</span>
                    <span className={`font-medium ${value >= 0 ? "text-white" : "text-red-400"}`}>
                      {sym}{Math.abs(value).toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${maxBar > 0 ? Math.min(100, Math.round((Math.abs(value) / maxBar) * 100)) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Result block */}
          {clientPrice > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Себестоимость", value: `${sym}${computed.total_cost.toLocaleString()}`, color: "text-red-400" },
                { label: "Прибыль",        value: `${sym}${computed.gross_profit.toLocaleString()}`, color: computed.gross_profit >= 0 ? "text-emerald-400" : "text-red-400" },
                { label: "Маржа",          value: `${computed.margin_percent.toFixed(1)}%`, color: computed.margin_percent >= 15 ? "text-emerald-400" : computed.margin_percent >= 5 ? "text-amber-400" : "text-red-400" },
              ].map((k) => (
                <div key={k.label} className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
                  <p className="text-slate-500 text-xs mb-1">{k.label}</p>
                  <p className={`font-bold text-lg ${k.color}`}>{k.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Стоимости</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Валюта</label>
                <select value={form.currency ?? "USD"} onChange={(e) => setF("currency", e.target.value)} className={sel}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c} {CURRENCY_SYMBOLS[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Цена для клиента</label>
                <input type="number" value={form.client_price ?? ""} onChange={(e) => setF("client_price", e.target.value)} placeholder="0" className={inp} />
              </div>
            </div>

            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest pt-2">Себестоимость</h4>
            <div className="grid grid-cols-2 gap-3">
              {([
                ["goods_cost",     "Товар"],
                ["delivery_cost",  "Доставка"],
                ["services_cost",  "Доп. услуги"],
                ["bank_fee",       "Комиссия банка"],
                ["customs_cost",   "Таможня"],
                ["other_expenses", "Прочее"],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs text-slate-500 mb-1 block">{label}</label>
                  <input
                    type="number"
                    value={(form[key] as number) ?? ""}
                    onChange={(e) => setF(key, e.target.value)}
                    placeholder="0"
                    className={inp}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Заметки</label>
              <textarea
                value={form.notes ?? ""}
                onChange={(e) => setF("notes", e.target.value)}
                rows={2}
                className={`${inp} resize-none`}
                placeholder="Комментарий к сделке..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={saveOrder}
                disabled={saving}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                  saved ? "bg-emerald-600 text-white" : "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white"
                }`}
              >
                {saved ? "✓ Сохранено" : saving ? "Сохраняем..." : order?.id ? "Обновить" : "Создать финансовую карточку"}
              </button>
              {order?.id && (
                <a
                  href={`/api/admin/finance/orders/pdf?lead_id=${leadId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 text-sm font-medium rounded-lg transition whitespace-nowrap"
                >
                  📄 PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === PAYMENTS TAB === */}
      {tab === "payments" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
              <p className="text-slate-400 text-xs mb-0.5">Оплачено</p>
              <p className="text-emerald-400 font-bold text-lg">{sym}{totalPaid.toLocaleString()}</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
              <p className="text-slate-400 text-xs mb-0.5">Ожидается</p>
              <p className="text-amber-400 font-bold text-lg">{sym}{totalPending.toLocaleString()}</p>
            </div>
          </div>

          {payments.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">Нет платежей</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white text-sm font-medium">{PAYMENT_TYPE_LABELS[p.type] ?? p.type}</p>
                    <p className="text-slate-500 text-xs">{p.payment_date || "—"} · {p.payment_method || "—"}</p>
                    {p.comment && <p className="text-slate-600 text-xs mt-0.5">{p.comment}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{sym}{(p.amount ?? 0).toLocaleString()}</span>
                    <select
                      value={p.status}
                      onChange={(e) => p.id && markPayment(p.id, e.target.value)}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                    >
                      <option value="paid">Оплачено</option>
                      <option value="pending">Ожидается</option>
                      <option value="cancelled">Отменено</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}

          {addPayment ? (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Новый платёж</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Тип</label>
                  <select value={payForm.type} onChange={(e) => setPayForm((f) => ({ ...f, type: e.target.value }))} className={sel}>
                    {Object.entries(PAYMENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Сумма</label>
                  <input type="number" value={payForm.amount} onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" className={inp} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Валюта</label>
                  <select value={payForm.currency} onChange={(e) => setPayForm((f) => ({ ...f, currency: e.target.value }))} className={sel}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Дата</label>
                  <input type="date" value={payForm.payment_date} onChange={(e) => setPayForm((f) => ({ ...f, payment_date: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Метод</label>
                  <input type="text" value={payForm.payment_method} onChange={(e) => setPayForm((f) => ({ ...f, payment_method: e.target.value }))} placeholder="Перевод / Наличные" className={inp} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Статус</label>
                  <select value={payForm.status} onChange={(e) => setPayForm((f) => ({ ...f, status: e.target.value }))} className={sel}>
                    {Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <input type="text" value={payForm.comment} onChange={(e) => setPayForm((f) => ({ ...f, comment: e.target.value }))} placeholder="Комментарий" className={inp} />
              <div className="flex gap-2">
                <button onClick={savePayment} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition">Добавить</button>
                <button onClick={() => setAddPayment(false)} className="px-4 py-2 border border-slate-700 text-slate-400 hover:text-white text-sm rounded-lg transition">Отмена</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddPayment(true)} className="w-full py-2 border border-slate-700 hover:border-emerald-600/50 text-slate-400 hover:text-white text-sm rounded-xl transition">
              + Добавить платёж
            </button>
          )}
        </div>
      )}

      {/* === EXPENSES TAB === */}
      {tab === "expenses" && (
        <div className="space-y-4">
          {expenses.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">Нет расходов</p>
          ) : (
            <div className="space-y-2">
              {expenses.map((e) => (
                <div key={e.id} className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white text-sm font-medium">{e.category}</p>
                    <p className="text-slate-500 text-xs">{e.expense_date || "—"}</p>
                    {e.description && <p className="text-slate-600 text-xs mt-0.5">{e.description}</p>}
                  </div>
                  <span className="font-semibold text-red-400">−{CURRENCY_SYMBOLS[e.currency as keyof typeof CURRENCY_SYMBOLS] ?? ""}{(e.amount ?? 0).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t border-slate-800">
                <span className="text-slate-400">Итого расходы</span>
                <span className="text-red-400 font-bold">{sym}{expenses.reduce((s, e) => s + (e.amount ?? 0), 0).toLocaleString()}</span>
              </div>
            </div>
          )}

          {addExpense ? (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Новый расход</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Категория</label>
                  <select value={expForm.category} onChange={(e) => setExpForm((f) => ({ ...f, category: e.target.value }))} className={sel}>
                    {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Сумма</label>
                  <input type="number" value={expForm.amount} onChange={(e) => setExpForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" className={inp} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Валюта</label>
                  <select value={expForm.currency} onChange={(e) => setExpForm((f) => ({ ...f, currency: e.target.value }))} className={sel}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Дата</label>
                  <input type="date" value={expForm.expense_date} onChange={(e) => setExpForm((f) => ({ ...f, expense_date: e.target.value }))} className={inp} />
                </div>
              </div>
              <input type="text" value={expForm.description} onChange={(e) => setExpForm((f) => ({ ...f, description: e.target.value }))} placeholder="Описание" className={inp} />
              <div className="flex gap-2">
                <button onClick={saveExpense} className="flex-1 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition">Добавить расход</button>
                <button onClick={() => setAddExpense(false)} className="px-4 py-2 border border-slate-700 text-slate-400 hover:text-white text-sm rounded-lg transition">Отмена</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddExpense(true)} className="w-full py-2 border border-slate-700 hover:border-red-600/50 text-slate-400 hover:text-white text-sm rounded-xl transition">
              + Добавить расход
            </button>
          )}
        </div>
      )}
    </div>
  );
}
