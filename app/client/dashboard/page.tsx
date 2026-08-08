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

      {/* AI tools quick access */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: "/product-finder",  icon: "🔍", label: "Найти товар",      sub: "AI поиск по 1688 и Alibaba" },
          { href: "/supplier-finder", icon: "🏭", label: "Найти поставщика", sub: "Supplier Score и аналитика" },
          { href: "/delivery-calculator", icon: "🧮", label: "Калькулятор",  sub: "Расчёт доставки за 30 сек" },
        ].map(tool => (
          <a
            key={tool.href}
            href={tool.href}
            className="flex items-start gap-3 bg-white border border-slate-200 hover:border-green-300 hover:shadow-sm rounded-xl p-4 transition-all group"
          >
            <span className="text-2xl mt-0.5">{tool.icon}</span>
            <div>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-green-700 transition-colors">{tool.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{tool.sub}</p>
            </div>
          </a>
        ))}
      </div>

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
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-6 py-10">
      <div className="max-w-md mx-auto text-center">
        <div className="text-5xl mb-4">🚀</div>
        <h3 className="text-slate-800 font-bold text-lg mb-2">Начните первую поставку</h3>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          Опишите товар — менеджер подберёт поставщика, рассчитает стоимость и проведёт вас по каждому шагу.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-sm shadow-green-200"
          >
            ✈️ Написать менеджеру
          </a>
          <a
            href="/delivery-calculator"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-green-300 hover:border-green-500 text-green-700 font-semibold rounded-xl transition-colors bg-white"
          >
            🧮 Рассчитать доставку
          </a>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-slate-400">
          <span>✓ Ответ за 15 минут</span>
          <span>✓ Бесплатная консультация</span>
          <span>✓ От 50 кг</span>
        </div>
      </div>
    </div>
  );
}
