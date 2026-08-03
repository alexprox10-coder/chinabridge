import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/client-portal/auth";
import { getClientOrders, getAllOrders } from "@/lib/client-portal/api";
import type { ClientOrder } from "@/lib/client-portal/types";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Ожидает оплаты",
  PARTIAL: "Частично оплачено",
  PAID: "Оплачено",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  UNPAID:  "bg-amber-50 text-amber-700 border-amber-200",
  PARTIAL: "bg-blue-50 text-blue-700 border-blue-200",
  PAID:    "bg-green-50 text-green-700 border-green-200",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", CNY: "¥", RUB: "₽", KZT: "₸",
};

function formatAmount(amount: number | undefined, currency = "RUB") {
  if (!amount) return "—";
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${sym}${amount.toLocaleString("ru-RU")}`;
}

export default async function PaymentsPage() {
  const session = await getSession();
  if (!session) redirect("/client/login");

  const orders = session.role === "CLIENT"
    ? await getClientOrders(session.clientId)
    : await getAllOrders();

  // Only orders with financial data
  const withPayments = orders.filter(
    (o) => o.product_cost || o.total_cost || o.payment_status
  );

  const totalPaid = orders
    .filter((o) => o.payment_status === "PAID")
    .reduce((s, o) => s + (o.total_cost ?? 0), 0);

  const totalPending = orders
    .filter((o) => o.payment_status === "UNPAID" || o.payment_status === "PARTIAL")
    .reduce((s, o) => s + (o.total_cost ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">💱 Оплаты</h1>
        <p className="text-slate-500 text-sm mt-1">
          Финансовая информация по вашим поставкам
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Всего поставок</p>
          <p className="text-3xl font-bold text-slate-900">{withPayments.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-2">Оплачено</p>
          <p className="text-3xl font-bold text-green-700">
            {totalPaid > 0 ? `₽${totalPaid.toLocaleString("ru-RU")}` : "—"}
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2">Ожидает оплаты</p>
          <p className="text-3xl font-bold text-amber-700">
            {totalPending > 0 ? `₽${totalPending.toLocaleString("ru-RU")}` : "—"}
          </p>
        </div>
      </div>

      {/* Payment list */}
      {withPayments.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl px-6 py-16 text-center">
          <div className="text-5xl mb-4">💱</div>
          <p className="text-slate-600 font-medium">Финансовых данных пока нет</p>
          <p className="text-slate-400 text-sm mt-1">
            Информация об оплатах появится после создания заявки
          </p>
          <Link
            href="/client/calculator"
            className="inline-block mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Рассчитать стоимость
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {withPayments.map((order) => (
            <PaymentRow key={order.order_id} order={order} />
          ))}
        </div>
      )}

      {/* Info block */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-600 space-y-2">
        <p className="font-semibold text-slate-700">💡 Как мы организуем оплату</p>
        <ul className="space-y-1 text-slate-500 text-xs">
          <li>• Валютные платежи поставщику проходят через официальные каналы</li>
          <li>• Стоимость товара фиксируется до оплаты — без скрытых наценок</li>
          <li>• Каждая оплата привязана к конкретной поставке</li>
          <li>• Вы получаете подтверждение оплаты с документами</li>
        </ul>
      </div>
    </div>
  );
}

function PaymentRow({ order }: { order: ClientOrder }) {
  const status = order.payment_status ?? "UNPAID";
  const statusLabel = PAYMENT_STATUS_LABELS[status] ?? status;
  const statusStyle = PAYMENT_STATUS_STYLES[status] ?? PAYMENT_STATUS_STYLES.UNPAID;
  const currency = order.currency ?? "RUB";

  return (
    <Link
      href={`/client/orders/${order.order_id}`}
      className="flex items-start gap-4 bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-green-300 hover:shadow-sm transition-all"
    >
      <div className="text-2xl mt-0.5">💱</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{order.title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{order.order_id}</p>

        {/* Financial breakdown */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          {order.product_cost ? (
            <span>Товар: <b className="text-slate-700">{formatAmount(order.product_cost, currency)}</b></span>
          ) : null}
          {order.logistics_cost ? (
            <span>Логистика: <b className="text-slate-700">{formatAmount(order.logistics_cost, "RUB")}</b></span>
          ) : null}
          {order.customs_cost ? (
            <span>Таможня: <b className="text-slate-700">{formatAmount(order.customs_cost, "RUB")}</b></span>
          ) : null}
          {order.total_cost ? (
            <span className="text-slate-700 font-semibold">
              Итого: {formatAmount(order.total_cost, "RUB")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyle}`}>
          {statusLabel}
        </span>
        <span className="text-slate-300 text-sm">→</span>
      </div>
    </Link>
  );
}
