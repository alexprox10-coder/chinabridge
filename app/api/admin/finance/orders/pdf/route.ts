import { NextRequest, NextResponse } from "next/server";
import { getFinanceOrderByLead, getPaymentsByLead, getExpensesByLead } from "@/lib/finance/api";
import { isAuthorized, getTenantId } from "@/lib/api-auth";
import { CURRENCY_SYMBOLS, PAYMENT_TYPE_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/finance/types";
import type { FinanceCurrency } from "@/lib/finance/types";
import {
  Document, Page, Text, View, StyleSheet, Font, renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page:        { fontFamily: "Helvetica", fontSize: 10, padding: 40, color: "#1e293b", backgroundColor: "#fff" },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  logo:        { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#059669" },
  logoSub:     { fontSize: 9, color: "#94a3b8", marginTop: 2 },
  stamp:       { fontSize: 8, color: "#94a3b8", textAlign: "right" },
  title:       { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 4 },
  subtitle:    { fontSize: 9, color: "#64748b", marginBottom: 20 },
  section:     { marginBottom: 16 },
  sectionTitle:{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  row:         { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  rowAlt:      { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, backgroundColor: "#f8fafc", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  label:       { color: "#475569", flex: 1 },
  value:       { fontFamily: "Helvetica-Bold", color: "#0f172a", textAlign: "right" },
  totalRow:    { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, marginTop: 4, backgroundColor: "#f1f5f9", paddingHorizontal: 6, borderRadius: 4 },
  totalLabel:  { fontFamily: "Helvetica-Bold", color: "#0f172a", flex: 1 },
  totalValue:  { fontFamily: "Helvetica-Bold", color: "#0f172a", textAlign: "right" },
  profitRow:   { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, backgroundColor: "#ecfdf5", paddingHorizontal: 6, borderRadius: 4, marginTop: 4 },
  profitLabel: { fontFamily: "Helvetica-Bold", color: "#059669", flex: 1, fontSize: 12 },
  profitValue: { fontFamily: "Helvetica-Bold", color: "#059669", textAlign: "right", fontSize: 12 },
  marginRow:   { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, backgroundColor: "#eff6ff", paddingHorizontal: 6, borderRadius: 4, marginTop: 4 },
  marginLabel: { fontFamily: "Helvetica-Bold", color: "#2563eb", flex: 1 },
  marginValue: { fontFamily: "Helvetica-Bold", color: "#2563eb", textAlign: "right" },
  barTrack:    { height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, marginTop: 2 },
  bar:         { height: 6, borderRadius: 3 },
  grid2:       { flexDirection: "row", gap: 8 },
  card:        { flex: 1, backgroundColor: "#f8fafc", borderRadius: 4, padding: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  cardLabel:   { fontSize: 8, color: "#94a3b8", marginBottom: 3 },
  cardValue:   { fontFamily: "Helvetica-Bold", fontSize: 11, color: "#0f172a" },
  footer:      { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#94a3b8" },
  divider:     { borderBottomWidth: 1, borderBottomColor: "#e2e8f0", marginVertical: 12 },
  chip:        { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, fontSize: 8 },
  paidChip:    { backgroundColor: "#ecfdf5", color: "#059669" },
  pendingChip: { backgroundColor: "#fefce8", color: "#d97706" },
  note:        { fontSize: 8, color: "#94a3b8", fontStyle: "italic", marginTop: 8 },
  watermark:   { fontSize: 8, color: "#94a3b8", backgroundColor: "#fef9c3", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: "#fde68a", marginBottom: 16 },
});

// ── PDF Document ──────────────────────────────────────────────────────────────

function FinancePDF({
  order, payments, expenses, reportDate,
}: {
  order: Awaited<ReturnType<typeof getFinanceOrderByLead>>;
  payments: Awaited<ReturnType<typeof getPaymentsByLead>>;
  expenses: Awaited<ReturnType<typeof getExpensesByLead>>;
  reportDate: string;
}) {
  if (!order) return React.createElement(Document, null);

  const sym = CURRENCY_SYMBOLS[order.currency as FinanceCurrency] ?? "$";
  const cur = order.currency ?? "USD";
  const fmt = (n: number) => `${sym}${(n ?? 0).toLocaleString("en-US")} ${cur}`;

  const costRows = [
    ["Товар / закупка", order.goods_cost],
    ["Доставка (логистика)", order.delivery_cost],
    ["Дополнительные услуги", order.services_cost],
    ["Комиссия банка", order.bank_fee],
    ["Таможенные расходы", order.customs_cost],
    ["Прочие расходы", order.other_expenses],
  ] as [string, number][];

  const totalPaid    = payments.filter((p) => p.status === "paid").reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + (p.amount ?? 0), 0);
  const maxBar       = Math.max(order.client_price ?? 0, order.total_cost ?? 0, 1);

  return React.createElement(
    Document,
    { title: `Финансовый отчёт — ${order.client_name}` },
    React.createElement(
      Page,
      { size: "A4", style: s.page },

      // Header
      React.createElement(View, { style: s.header },
        React.createElement(View, null,
          React.createElement(Text, { style: s.logo }, "ChinaBridge"),
          React.createElement(Text, { style: s.logoSub }, "Доставка и закупки из Китая")
        ),
        React.createElement(View, null,
          React.createElement(Text, { style: s.stamp }, `ФИНАНСОВЫЙ ОТЧЁТ`),
          React.createElement(Text, { style: s.stamp }, `Дата: ${reportDate}`),
          React.createElement(Text, { style: s.stamp }, `Менеджер: ${order.manager || "—"}`),
        )
      ),

      // Confidential watermark
      React.createElement(View, { style: s.watermark },
        React.createElement(Text, null, "🔒 ВНУТРЕННИЙ ДОКУМЕНТ · Только для ADMIN и MANAGER · Не передаётся клиенту")
      ),

      // Title
      React.createElement(Text, { style: s.title }, `Сделка: ${order.client_name}`),
      React.createElement(Text, { style: s.subtitle }, `ID: ${order.lead_id || "—"} · Статус: ${order.status || "active"} · Валюта: ${cur}`),

      // Cards: Client price + profit + margin
      React.createElement(View, { style: [s.grid2, { marginBottom: 16 }] },
        React.createElement(View, { style: s.card },
          React.createElement(Text, { style: s.cardLabel }, "Цена клиента"),
          React.createElement(Text, { style: s.cardValue }, fmt(order.client_price ?? 0))
        ),
        React.createElement(View, { style: s.card },
          React.createElement(Text, { style: s.cardLabel }, "Себестоимость"),
          React.createElement(Text, { style: s.cardValue }, fmt(order.total_cost ?? 0))
        ),
        React.createElement(View, { style: [s.card, { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }] },
          React.createElement(Text, { style: [s.cardLabel, { color: "#059669" }] }, "Прибыль"),
          React.createElement(Text, { style: [s.cardValue, { color: "#059669" }] }, fmt(order.gross_profit ?? 0))
        ),
        React.createElement(View, { style: [s.card, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }] },
          React.createElement(Text, { style: [s.cardLabel, { color: "#2563eb" }] }, "Маржа"),
          React.createElement(Text, { style: [s.cardValue, { color: "#2563eb" }] }, `${(order.margin_percent ?? 0).toFixed(1)}%`)
        ),
      ),

      // Visual bars
      React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Финансовая шкала"),
        ...[
          { label: "Получено от клиента", value: order.client_price ?? 0, color: "#3b82f6" },
          { label: "Себестоимость", value: order.total_cost ?? 0, color: "#ef4444" },
          { label: "Чистая прибыль", value: order.gross_profit ?? 0, color: "#10b981" },
        ].map(({ label, value, color }) =>
          React.createElement(View, { key: label, style: { marginBottom: 6 } },
            React.createElement(View, { style: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 } },
              React.createElement(Text, { style: { color: "#475569", fontSize: 9 } }, label),
              React.createElement(Text, { style: { fontFamily: "Helvetica-Bold", fontSize: 9 } }, fmt(value)),
            ),
            React.createElement(View, { style: s.barTrack },
              React.createElement(View, { style: [s.bar, { width: `${Math.min(100, Math.round((Math.abs(value) / maxBar) * 100))}%`, backgroundColor: color }] })
            )
          )
        )
      ),

      // Cost breakdown
      React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Структура себестоимости"),
        ...costRows.map(([label, val], i) =>
          React.createElement(View, { key: label, style: i % 2 === 0 ? s.row : s.rowAlt },
            React.createElement(Text, { style: s.label }, label),
            React.createElement(Text, { style: s.value }, fmt(val ?? 0)),
          )
        ),
        React.createElement(View, { style: s.totalRow },
          React.createElement(Text, { style: s.totalLabel }, "ИТОГО СЕБЕСТОИМОСТЬ"),
          React.createElement(Text, { style: s.totalValue }, fmt(order.total_cost ?? 0)),
        ),
        React.createElement(View, { style: s.profitRow },
          React.createElement(Text, { style: s.profitLabel }, "ПРИБЫЛЬ"),
          React.createElement(Text, { style: s.profitValue }, fmt(order.gross_profit ?? 0)),
        ),
        React.createElement(View, { style: s.marginRow },
          React.createElement(Text, { style: s.marginLabel }, "МАРЖИНАЛЬНОСТЬ"),
          React.createElement(Text, { style: s.marginValue }, `${(order.margin_percent ?? 0).toFixed(2)}%`),
        ),
      ),

      // Payments
      payments.length > 0 && React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Платежи клиента"),
        ...payments.map((p, i) =>
          React.createElement(View, { key: p.id ?? i, style: i % 2 === 0 ? s.row : s.rowAlt },
            React.createElement(Text, { style: s.label }, `${PAYMENT_TYPE_LABELS[p.type] ?? p.type} · ${p.payment_date || "—"}`),
            React.createElement(View, { style: { flexDirection: "row", gap: 8, alignItems: "center" } },
              React.createElement(Text, { style: { fontSize: 8, color: p.status === "paid" ? "#059669" : "#d97706" } },
                PAYMENT_STATUS_LABELS[p.status] ?? p.status
              ),
              React.createElement(Text, { style: s.value }, `${CURRENCY_SYMBOLS[p.currency as FinanceCurrency] ?? ""}${(p.amount ?? 0).toLocaleString()} ${p.currency}`),
            )
          )
        ),
        React.createElement(View, { style: s.totalRow },
          React.createElement(Text, { style: s.totalLabel }, "Оплачено"),
          React.createElement(Text, { style: [s.totalValue, { color: "#059669" }] }, fmt(totalPaid)),
        ),
        totalPending > 0 && React.createElement(View, { style: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, paddingHorizontal: 6, backgroundColor: "#fefce8", borderRadius: 4 } },
          React.createElement(Text, { style: { color: "#d97706" } }, "Ожидается"),
          React.createElement(Text, { style: { fontFamily: "Helvetica-Bold", color: "#d97706" } }, fmt(totalPending)),
        ),
      ),

      // Expenses
      expenses.length > 0 && React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Дополнительные расходы"),
        ...expenses.map((e, i) =>
          React.createElement(View, { key: e.id ?? i, style: i % 2 === 0 ? s.row : s.rowAlt },
            React.createElement(Text, { style: s.label }, `${e.category} ${e.description ? `· ${e.description}` : ""}`),
            React.createElement(Text, { style: [s.value, { color: "#ef4444" }] },
              `−${CURRENCY_SYMBOLS[e.currency as FinanceCurrency] ?? ""}${(e.amount ?? 0).toLocaleString()} ${e.currency}`
            ),
          )
        ),
        React.createElement(View, { style: { ...s.totalRow, backgroundColor: "#fef2f2" } },
          React.createElement(Text, { style: { ...s.totalLabel, color: "#ef4444" } }, "Итого расходы"),
          React.createElement(Text, { style: { ...s.totalValue, color: "#ef4444" } },
            `−${fmt(expenses.reduce((s, e) => s + (e.amount ?? 0), 0))}`
          ),
        ),
      ),

      // Notes
      order.notes && React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Примечания"),
        React.createElement(Text, { style: { fontSize: 9, color: "#475569" } }, order.notes),
      ),

      // Footer
      React.createElement(View, { style: s.footer },
        React.createElement(Text, null, "ChinaBridge · chinabridge.ru · Конфиденциально"),
        React.createElement(Text, null, `Отчёт сформирован: ${reportDate}`),
      ),
    )
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = getTenantId(req);
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("lead_id");
  if (!leadId) return NextResponse.json({ error: "lead_id required" }, { status: 400 });

  const [order, payments, expenses] = await Promise.all([
    getFinanceOrderByLead(tenantId, leadId),
    getPaymentsByLead(tenantId, leadId),
    getExpensesByLead(tenantId, leadId),
  ]);

  if (!order) return NextResponse.json({ error: "Finance record not found. Create it first." }, { status: 404 });

  const reportDate = new Date().toLocaleDateString("ru-RU", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const buffer = await renderToBuffer(
    FinancePDF({ order, payments, expenses, reportDate })
  );

  const filename = `chinabridge_finance_${(order.client_name || leadId).replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
