import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/client-portal/auth";
import { getClientOrders, getAllOrders, countUnreadMessages } from "@/lib/client-portal/api";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/client-portal/types";
import type { ClientOrder } from "@/lib/client-portal/types";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/client/login");

  const [orders, unread] = await Promise.all([
    session.role === "CLIENT" ? getClientOrders(session.clientId) : getAllOrders(),
    countUnreadMessages(session.clientId),
  ]);

  const active = orders.filter((o) => o.status !== "COMPLETED");
  const completed = orders.filter((o) => o.status === "COMPLETED");
  const inTransit = orders.filter((o) => o.status === "IN_TRANSIT");
  const recent = [...orders].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Добро пожаловать, {session.name.split(" ")[0]}</h1>
        <p className="text-slate-500 text-sm mt-1">Обзор ваших грузов и заявок</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Всего заявок" value={orders.length} icon="📦" />
        <StatCard label="В работе" value={active.length} icon="⚙️" accent />
        <StatCard label="В пути" value={inTransit.length} icon="🚛" />
        <StatCard label="Выполнено" value={completed.length} icon="✅" />
      </div>

      {/* Unread messages banner */}
      {unread > 0 && (
        <Link href="/client/messages" className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 hover:bg-blue-100 transition-colors">
          <span className="text-2xl">💬</span>
          <div>
            <p className="text-sm font-semibold text-blue-800">У вас {unread} непрочитанных сообщений</p>
            <p className="text-xs text-blue-600">Нажмите, чтобы открыть</p>
          </div>
          <span className="ml-auto text-blue-400">→</span>
        </Link>
      )}

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">Последние заявки</h2>
          <Link href="/client/orders" className="text-sm text-green-600 hover:text-green-700 font-medium">
            Все заявки →
          </Link>
        </div>
        <div className="space-y-3">
          {recent.length === 0 ? (
            <EmptyState />
          ) : (
            recent.map((order) => <OrderRow key={order.order_id} order={order} />)
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: string; accent?: boolean }) {
  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm ${accent ? "border-green-200" : "border-slate-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${accent ? "text-green-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function OrderRow({ order }: { order: ClientOrder }) {
  const colors = ORDER_STATUS_COLORS[order.status];
  return (
    <Link
      href={`/client/orders/${order.order_id}`}
      className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-green-300 hover:shadow-sm transition-all"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{order.title}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {order.order_id} · {new Date(order.created_at).toLocaleDateString("ru-RU")}
        </p>
      </div>
      <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${colors.badge}`}>
        {ORDER_STATUS_LABELS[order.status]}
      </span>
      <span className="text-slate-300 text-sm">→</span>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="bg-white border border-dashed border-slate-300 rounded-xl px-6 py-10 text-center">
      <div className="text-4xl mb-3">📦</div>
      <p className="text-slate-500 text-sm">Заявок пока нет</p>
      <p className="text-slate-400 text-xs mt-1">Обратитесь к менеджеру для создания первой заявки</p>
    </div>
  );
}
