import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/client-portal/auth";
import { getOrderById, getOrderTracking, getOrderDocuments } from "@/lib/client-portal/api";
import {
  ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, DOC_TYPE_LABELS,
} from "@/lib/client-portal/types";
import type { OrderStatus, OrderTracking, ClientDocument } from "@/lib/client-portal/types";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/client/login");

  const { id } = await params;
  const [order, tracking, documents] = await Promise.all([
    getOrderById(id),
    getOrderTracking(id),
    getOrderDocuments(id),
  ]);

  if (!order) notFound();
  if (session.role === "CLIENT" && order.client_id !== session.clientId) notFound();

  const currentStep = ORDER_STATUSES.indexOf(order.status);
  const photos: string[] = order.inspection_photos
    ? JSON.parse(order.inspection_photos).filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/client/orders" className="hover:text-slate-600">Заявки</Link>
        <span>/</span>
        <span className="text-slate-700 font-medium truncate">{order.title}</span>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{order.title}</h1>
            <p className="text-sm text-slate-400 mt-1">
              Заявка #{order.order_id} · создана {new Date(order.created_at).toLocaleDateString("ru-RU")}
            </p>
            {order.product_description && (
              <p className="text-sm text-slate-600 mt-2">{order.product_description}</p>
            )}
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${ORDER_STATUS_COLORS[order.status].badge}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* Manager */}
        {order.manager_name && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold">
              {order.manager_name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Менеджер: {order.manager_name}</p>
              {order.manager_telegram && (
                <a
                  href={`https://t.me/${order.manager_telegram.replace("@", "")}`}
                  className="text-xs text-blue-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {order.manager_telegram}
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress tracker */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-5">Этапы доставки</h2>
        <div className="overflow-x-auto pb-2">
          <div className="flex items-start gap-0 min-w-max">
            {ORDER_STATUSES.map((s, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={s} className="flex items-start">
                  {/* Step */}
                  <div className="flex flex-col items-center w-20">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                      done    ? "bg-green-500 border-green-500 text-white" :
                      active  ? "bg-white border-green-500 text-green-600" :
                                "bg-white border-slate-200 text-slate-300"
                    }`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <p className={`text-center text-[10px] mt-1.5 leading-tight px-1 ${
                      active ? "text-green-600 font-semibold" :
                      done   ? "text-slate-500" : "text-slate-300"
                    }`}>
                      {ORDER_STATUS_LABELS[s]}
                    </p>
                  </div>
                  {/* Connector */}
                  {i < ORDER_STATUSES.length - 1 && (
                    <div className={`w-8 h-0.5 mt-3.5 flex-shrink-0 ${i < currentStep ? "bg-green-400" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Finance block */}
      {(order.product_cost || order.logistics_cost || order.customs_cost || order.total_cost) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Финансы</h2>
          <div className="space-y-3">
            {order.product_cost && (
              <FinRow label="Товар" value={order.product_cost} currency={order.currency} />
            )}
            {order.logistics_cost && (
              <FinRow label="Логистика" value={order.logistics_cost} currency={order.currency} />
            )}
            {order.customs_cost && (
              <FinRow label="Таможня" value={order.customs_cost} currency={order.currency} />
            )}
            {order.total_cost && (
              <div className="border-t border-slate-100 pt-3">
                <FinRow label="Итого" value={order.total_cost} currency={order.currency} bold />
              </div>
            )}
          </div>
          {order.payment_status && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">Статус оплаты</span>
              <PaymentBadge status={order.payment_status} />
            </div>
          )}
        </div>
      )}

      {/* Cargo details */}
      {(order.cargo_weight || order.cargo_volume || order.origin_country || order.destination_city) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Груз</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {order.cargo_weight && <InfoCell label="Вес" value={`${order.cargo_weight} кг`} />}
            {order.cargo_volume && <InfoCell label="Объём" value={`${order.cargo_volume} м³`} />}
            {order.origin_country && <InfoCell label="Откуда" value={order.origin_country} />}
            {order.destination_city && <InfoCell label="Куда" value={order.destination_city} />}
          </div>
          {order.estimated_delivery && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <InfoCell
                label="Ожидаемая дата доставки"
                value={new Date(order.estimated_delivery).toLocaleDateString("ru-RU", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              />
            </div>
          )}
        </div>
      )}

      {/* Tracking timeline */}
      {tracking.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-5">История событий</h2>
          <TrackingTimeline events={tracking} />
        </div>
      )}

      {/* Inspection photos */}
      {photos.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Фото инспекции</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Фото ${i + 1}`}
                  className="w-full aspect-video object-cover rounded-lg border border-slate-200 hover:opacity-90 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Документы</h2>
          <div className="space-y-2">
            {documents.map((doc) => <DocRow key={doc.id} doc={doc} />)}
          </div>
        </div>
      )}

      {/* Chat link */}
      <Link
        href={`/client/messages?order=${order.order_id}`}
        className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 hover:bg-green-50 hover:border-green-200 transition-colors"
      >
        <span className="text-2xl">💬</span>
        <div>
          <p className="text-sm font-semibold text-slate-800">Написать менеджеру</p>
          <p className="text-xs text-slate-400">Задайте вопрос по этой заявке</p>
        </div>
        <span className="ml-auto text-slate-300">→</span>
      </Link>
    </div>
  );
}

function FinRow({ label, value, currency, bold }: { label: string; value: number; currency?: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-semibold" : ""}`}>
      <span className={`text-sm ${bold ? "text-slate-900" : "text-slate-500"}`}>{label}</span>
      <span className={`text-sm ${bold ? "text-slate-900 text-base" : "text-slate-700"}`}>
        {value.toLocaleString("ru-RU")} {currency ?? "₽"}
      </span>
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    UNPAID:  { label: "Не оплачено", cls: "bg-red-50 text-red-600 border-red-200" },
    PARTIAL: { label: "Частично",    cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    PAID:    { label: "Оплачено",    cls: "bg-green-50 text-green-700 border-green-200" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-slate-50 text-slate-600 border-slate-200" };
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cls}`}>{label}</span>;
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function TrackingTimeline({ events }: { events: OrderTracking[] }) {
  return (
    <div className="space-y-4">
      {events.map((e, i) => (
        <div key={e.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full mt-0.5 ${i === 0 ? "bg-green-500" : "bg-slate-300"}`} />
            {i < events.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1.5" />}
          </div>
          <div className="pb-4 min-w-0">
            <p className="text-sm font-medium text-slate-800">{ORDER_STATUS_LABELS[e.status as OrderStatus] ?? e.status}</p>
            <p className="text-sm text-slate-600 mt-0.5">{e.description}</p>
            {e.location && <p className="text-xs text-slate-400 mt-0.5">📍 {e.location}</p>}
            <p className="text-xs text-slate-400 mt-1">
              {new Date(e.timestamp).toLocaleString("ru-RU", {
                day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DocRow({ doc }: { doc: ClientDocument }) {
  return (
    <a
      href={doc.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group"
    >
      <span className="text-xl">📎</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
        <p className="text-xs text-slate-400">{DOC_TYPE_LABELS[doc.doc_type]}</p>
      </div>
      <span className="text-xs text-green-600 font-medium group-hover:underline shrink-0">Скачать</span>
    </a>
  );
}
