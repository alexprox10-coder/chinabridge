import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/client-portal/auth";
import { getClientOrders, getAllOrders } from "@/lib/client-portal/api";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUSES } from "@/lib/client-portal/types";
import type { ClientOrder, OrderStatus } from "@/lib/client-portal/types";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/client/login");

  const orders = session.role === "CLIENT"
    ? await getClientOrders(session.clientId)
    : await getAllOrders();

  const active = orders.filter((o) => o.status !== "COMPLETED");
  const done   = orders.filter((o) => o.status === "COMPLETED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Мои заявки</h1>
        <p className="text-slate-500 text-sm mt-1">
          {active.length} в работе · {done.length} выполнено
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl px-6 py-16 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-slate-600 font-medium">Заявок пока нет</p>
          <p className="text-slate-400 text-sm mt-1">Ваши грузы появятся здесь после создания заявки</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => <OrderCard key={order.order_id} order={order} />)}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: ClientOrder }) {
  const colors = ORDER_STATUS_COLORS[order.status];
  const statusIndex = ORDER_STATUSES.indexOf(order.status);
  const progress = Math.round((statusIndex / (ORDER_STATUSES.length - 1)) * 100);

  return (
    <Link
      href={`/client/orders/${order.order_id}`}
      className="block bg-white border border-slate-200 rounded-2xl p-5 hover:border-green-300 hover:shadow-sm transition-all"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{order.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            #{order.order_id} · создана {new Date(order.created_at).toLocaleDateString("ru-RU")}
          </p>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${colors.badge}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-slate-400">
          <span>Новая</span>
          <span>{progress}%</span>
          <span>Выполнено</span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
        {order.destination_city && <span>📍 {order.destination_city}</span>}
        {order.total_cost && (
          <span>💰 {order.total_cost.toLocaleString("ru-RU")} {order.currency ?? "₽"}</span>
        )}
        {order.estimated_delivery && (
          <span>📅 до {new Date(order.estimated_delivery).toLocaleDateString("ru-RU")}</span>
        )}
      </div>
    </Link>
  );
}
