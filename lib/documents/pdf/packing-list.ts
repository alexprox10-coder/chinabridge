import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { shared } from "./shared-styles";
import type { DocRenderData } from "../types";

export function PackingListPDF(d: DocRenderData) {
  const co = d.company;

  return React.createElement(
    Document, { title: `Packing List ${d.document_number}` },
    React.createElement(Page, { size: "A4", style: shared.page },

      // Header
      React.createElement(View, { style: shared.header },
        React.createElement(Text, { style: shared.logo }, "ChinaBridge"),
        React.createElement(View, null,
          React.createElement(Text, { style: shared.docTitle }, "УПАКОВОЧНЫЙ ЛИСТ"),
          React.createElement(Text, { style: shared.docNum }, `PACKING LIST · №${d.document_number} · ${d.document_date}`),
        ),
      ),

      // Parties
      React.createElement(View, { style: shared.twoCol },
        React.createElement(View, { style: shared.col },
          React.createElement(Text, { style: shared.colTitle }, "ОТПРАВИТЕЛЬ / SHIPPER"),
          ...[
            ["Компания", co.company_name],
            ["ИНН", co.inn],
            ["Адрес", co.address],
          ].map(([l, v]) => React.createElement(View, { key: l, style: shared.colRow },
            React.createElement(Text, { style: shared.colLabel }, `${l}:`),
            React.createElement(Text, { style: shared.colValue }, v || "—"),
          )),
        ),
        React.createElement(View, { style: shared.col },
          React.createElement(Text, { style: shared.colTitle }, "ПОЛУЧАТЕЛЬ / CONSIGNEE"),
          ...[
            ["Получатель", d.client_name],
            ["Тел.", d.client_phone || "—"],
            ["Маршрут", d.route || "—"],
          ].map(([l, v]) => React.createElement(View, { key: l, style: shared.colRow },
            React.createElement(Text, { style: shared.colLabel }, `${l}:`),
            React.createElement(Text, { style: shared.colValue }, v || "—"),
          )),
        ),
      ),

      // Cargo main table
      React.createElement(View, { style: { marginBottom: 10 } },
        React.createElement(Text, { style: shared.sectionTitle }, "Данные груза / Cargo Details"),
        React.createElement(View, { style: shared.table },
          React.createElement(View, { style: shared.tableHeader },
            React.createElement(Text, { style: [shared.thText, { flex: 3 }] }, "Наименование / Description"),
            React.createElement(Text, { style: [shared.thText, { width: 50, textAlign: "center" }] }, "Кол-во / Qty"),
            React.createElement(Text, { style: [shared.thText, { width: 60, textAlign: "center" }] }, "Вес / Weight"),
            React.createElement(Text, { style: [shared.thText, { width: 60, textAlign: "center" }] }, "Объём / Volume"),
            React.createElement(Text, { style: [shared.thText, { width: 70, textAlign: "center" }] }, "Упаковка / Package"),
          ),
          React.createElement(View, { style: shared.tableRow },
            React.createElement(Text, { style: [shared.tdText, { flex: 3 }] }, d.product),
            React.createElement(Text, { style: [shared.tdText, { width: 50, textAlign: "center" }] }, d.quantity || "1"),
            React.createElement(Text, { style: [shared.tdText, { width: 60, textAlign: "center" }] }, d.weight ? `${d.weight} кг` : "—"),
            React.createElement(Text, { style: [shared.tdText, { width: 60, textAlign: "center" }] }, d.volume ? `${d.volume} м³` : "—"),
            React.createElement(Text, { style: [shared.tdText, { width: 70, textAlign: "center" }] }, d.packaging || "Картонные коробки"),
          ),
        ),
      ),

      // Summary boxes
      React.createElement(View, { style: { flexDirection: "row", gap: 8, marginBottom: 16 } },
        ...[
          ["Общий вес брутто / Gross Weight", d.weight ? `${d.weight} кг` : "—"],
          ["Объём / Volume (CBM)", d.volume ? `${d.volume} м³` : "—"],
          ["Маршрут / Route", d.route || "Китай — РФ/Казахстан"],
          ["Мест / Packages", d.quantity || "1"],
        ].map(([label, value]) =>
          React.createElement(View, { key: label as string, style: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 4, padding: 8, borderWidth: 1, borderColor: "#e2e8f0" } },
            React.createElement(Text, { style: { fontSize: 7, color: "#94a3b8", marginBottom: 3 } }, label),
            React.createElement(Text, { style: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0f172a" } }, value as string),
          )
        ),
      ),

      // Handling instructions
      React.createElement(View, { style: shared.section },
        React.createElement(Text, { style: shared.sectionTitle }, "Инструкции по обращению / Handling Instructions"),
        React.createElement(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: 6 } },
          ...["🔒 Хрупкий груз / Fragile", "☂ Беречь от влаги / Keep dry", "⬆ Верх / This side up", "🌡 Температурный режим: 0–35°C"].map((t) =>
            React.createElement(View, { key: t, style: { backgroundColor: "#f1f5f9", borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3 } },
              React.createElement(Text, { style: { fontSize: 8, color: "#475569" } }, t),
            )
          ),
        ),
      ),

      // Signatures
      React.createElement(View, { style: shared.sigRow },
        React.createElement(View, { style: shared.sigBlock },
          React.createElement(View, { style: shared.sigLine },
            React.createElement(Text, { style: shared.sigLabel }, `Отправитель / Shipper: ${co.director}`),
          ),
        ),
        React.createElement(View, { style: shared.sigBlock },
          React.createElement(View, { style: shared.sigLine },
            React.createElement(Text, { style: shared.sigLabel }, `Получатель / Consignee: ${d.client_name}`),
          ),
        ),
      ),

      React.createElement(View, { style: shared.footer },
        React.createElement(Text, null, "ChinaBridge · chinabridge.pro"),
        React.createElement(Text, null, `Packing List №${d.document_number} · ${d.document_date}`),
      ),
    )
  );
}
