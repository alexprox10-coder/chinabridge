import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { shared } from "./shared-styles";
import type { DocRenderData } from "../types";
import { CURRENCY_SYMBOLS_DOC } from "../types";

export function ActPDF(d: DocRenderData) {
  const sym = CURRENCY_SYMBOLS_DOC[d.currency] ?? d.currency;
  const fmt = (n: number) => `${sym}${(n ?? 0).toLocaleString("ru-RU")}`;
  const co = d.company;

  const services = [
    { name: `Поиск и выкуп товара: ${d.product}`, sum: d.goods_cost },
    { name: "Доставка из Китая", sum: d.delivery_cost },
    ...(d.services_cost > 0 ? [{ name: "Дополнительные услуги", sum: d.services_cost }] : []),
    ...(d.bank_fee > 0 ? [{ name: "Банковская комиссия", sum: d.bank_fee }] : []),
    ...(d.customs_cost > 0 ? [{ name: "Таможенное оформление", sum: d.customs_cost }] : []),
  ];

  return React.createElement(
    Document, { title: `Акт №${d.document_number}` },
    React.createElement(Page, { size: "A4", style: shared.page },

      // Header
      React.createElement(View, { style: shared.header },
        React.createElement(Text, { style: shared.logo }, "ChinaBridge"),
        React.createElement(View, null,
          React.createElement(Text, { style: shared.docTitle }, "АКТ ВЫПОЛНЕННЫХ РАБОТ"),
          React.createElement(Text, { style: shared.docNum }, `№ ${d.document_number} от ${d.document_date}`),
        ),
      ),

      // Parties
      React.createElement(View, { style: shared.twoCol },
        React.createElement(View, { style: shared.col },
          React.createElement(Text, { style: shared.colTitle }, "ИСПОЛНИТЕЛЬ"),
          ...[
            ["Организация", co.company_name],
            ["ИНН", co.inn],
            ["Адрес", co.address],
            ["Тел.", co.phone || "—"],
          ].map(([l, v]) => React.createElement(View, { key: l, style: shared.colRow },
            React.createElement(Text, { style: shared.colLabel }, `${l}:`),
            React.createElement(Text, { style: shared.colValue }, v || "—"),
          )),
        ),
        React.createElement(View, { style: shared.col },
          React.createElement(Text, { style: shared.colTitle }, "ЗАКАЗЧИК"),
          ...[
            ["Заказчик", d.client_name],
            ["ИНН", d.client_inn || "—"],
            ["Тел.", d.client_phone || "—"],
          ].map(([l, v]) => React.createElement(View, { key: l, style: shared.colRow },
            React.createElement(Text, { style: shared.colLabel }, `${l}:`),
            React.createElement(Text, { style: shared.colValue }, v || "—"),
          )),
        ),
      ),

      // Intro text
      React.createElement(Text, { style: { fontSize: 9, color: "#1e293b", lineHeight: 1.6, marginBottom: 12 } },
        `Мы, нижеподписавшиеся, ${co.company_name} (Исполнитель) и ${d.client_name} (Заказчик), составили настоящий акт о том, что Исполнитель выполнил, а Заказчик принял следующие работы/услуги:`
      ),

      // Services table
      React.createElement(View, { style: shared.table },
        React.createElement(View, { style: shared.tableHeader },
          React.createElement(Text, { style: [shared.thText, shared.itemNum] }, "№"),
          React.createElement(Text, { style: [shared.thText, shared.itemName] }, "Наименование услуги"),
          React.createElement(Text, { style: [shared.thText, shared.itemQty] }, "Кол."),
          React.createElement(Text, { style: [shared.thText, shared.itemUnit] }, "Ед."),
          React.createElement(Text, { style: [shared.thText, shared.itemTotal] }, "Сумма"),
        ),
        ...services.map((svc, i) =>
          React.createElement(View, { key: i, style: i % 2 === 0 ? shared.tableRow : shared.tableRowAlt },
            React.createElement(Text, { style: [shared.tdText, shared.itemNum] }, `${i + 1}`),
            React.createElement(Text, { style: [shared.tdText, shared.itemName] }, svc.name),
            React.createElement(Text, { style: [shared.tdText, shared.itemQty] }, "1"),
            React.createElement(Text, { style: [shared.tdText, shared.itemUnit] }, "усл."),
            React.createElement(Text, { style: [shared.tdText, shared.itemTotal] }, fmt(svc.sum)),
          )
        ),
      ),
      React.createElement(View, { style: shared.totalRow },
        React.createElement(Text, { style: shared.totalLabel }, "ИТОГО:"),
        React.createElement(Text, { style: shared.totalValue }, fmt(d.client_price)),
      ),
      React.createElement(Text, { style: { fontSize: 8, color: "#64748b", marginTop: 4, marginBottom: 12 } },
        "НДС не облагается (УСН)"
      ),

      // Confirmation
      React.createElement(Text, { style: { fontSize: 9, color: "#1e293b", lineHeight: 1.6, marginBottom: 16 } },
        "Вышеперечисленные работы/услуги выполнены полностью и в срок. Заказчик претензий по объёму, качеству и срокам выполнения работ/оказания услуг не имеет."
      ),

      // Signatures
      React.createElement(View, { style: shared.sigRow },
        React.createElement(View, { style: shared.sigBlock },
          React.createElement(Text, { style: { fontSize: 9, color: "#475569", marginBottom: 4 } }, "Исполнитель:"),
          React.createElement(View, { style: shared.sigLine },
            React.createElement(Text, { style: shared.sigLabel }, co.director),
          ),
          React.createElement(Text, { style: { fontSize: 8, color: "#94a3b8", marginTop: 3 } }, `М.П.`),
        ),
        React.createElement(View, { style: shared.sigBlock },
          React.createElement(Text, { style: { fontSize: 9, color: "#475569", marginBottom: 4 } }, "Заказчик:"),
          React.createElement(View, { style: shared.sigLine },
            React.createElement(Text, { style: shared.sigLabel }, d.client_name),
          ),
          React.createElement(Text, { style: { fontSize: 8, color: "#94a3b8", marginTop: 3 } }, `М.П.`),
        ),
      ),

      React.createElement(View, { style: shared.footer },
        React.createElement(Text, null, "ChinaBridge · chinabridge.pro"),
        React.createElement(Text, null, `Акт №${d.document_number} от ${d.document_date}`),
      ),
    )
  );
}
