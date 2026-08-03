import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { shared } from "./shared-styles";
import type { DocRenderData } from "../types";
import { CURRENCY_SYMBOLS_DOC } from "../types";

export function InvoicePDF(d: DocRenderData) {
  const sym = CURRENCY_SYMBOLS_DOC[d.currency] ?? d.currency;
  const fmt = (n: number) => `${sym}${(n ?? 0).toLocaleString("ru-RU")}`;
  const co = d.company;

  const lines = [
    { name: `Поиск и выкуп товара: ${d.product}`, qty: 1, unit: "усл.", price: d.goods_cost },
    { name: "Доставка из Китая", qty: 1, unit: "усл.", price: d.delivery_cost },
    ...(d.services_cost > 0 ? [{ name: "Дополнительные услуги", qty: 1, unit: "усл.", price: d.services_cost }] : []),
    ...(d.bank_fee > 0 ? [{ name: "Банковская комиссия", qty: 1, unit: "усл.", price: d.bank_fee }] : []),
    ...(d.customs_cost > 0 ? [{ name: "Таможенное оформление", qty: 1, unit: "усл.", price: d.customs_cost }] : []),
  ];

  return React.createElement(
    Document, { title: `Счёт №${d.document_number}` },
    React.createElement(Page, { size: "A4", style: shared.page },

      // Header
      React.createElement(View, { style: shared.header },
        React.createElement(View, { style: shared.logoBlock },
          React.createElement(Text, { style: shared.logo }, "ChinaBridge"),
          React.createElement(Text, { style: shared.logoSub }, "Доставка и закупки из Китая"),
        ),
        React.createElement(View, null,
          React.createElement(Text, { style: shared.docTitle }, "СЧЁТ НА ОПЛАТУ"),
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
            ["ОГРНИП", co.ogrnip || "—"],
            ["Адрес", co.address],
            ["Телефон", co.phone || "—"],
            ["E-mail", co.email],
          ].map(([l, v]) => React.createElement(View, { key: l, style: shared.colRow },
            React.createElement(Text, { style: shared.colLabel }, `${l}:`),
            React.createElement(Text, { style: shared.colValue }, v || "—"),
          )),
        ),
        React.createElement(View, { style: shared.col },
          React.createElement(Text, { style: shared.colTitle }, "ПЛАТЕЛЬЩИК"),
          ...[
            ["Плательщик", d.client_name],
            ["ИНН", d.client_inn || "—"],
            ["Телефон", d.client_phone || "—"],
            ["E-mail", d.client_email || "—"],
            ["Адрес", d.client_address || "—"],
            ["Маршрут", d.route || "—"],
          ].map(([l, v]) => React.createElement(View, { key: l, style: shared.colRow },
            React.createElement(Text, { style: shared.colLabel }, `${l}:`),
            React.createElement(Text, { style: shared.colValue }, v || "—"),
          )),
        ),
      ),

      // Table
      React.createElement(View, { style: shared.section },
        React.createElement(Text, { style: shared.sectionTitle }, "Перечень услуг"),
        React.createElement(View, { style: shared.table },
          React.createElement(View, { style: shared.tableHeader },
            React.createElement(Text, { style: [shared.thText, shared.itemNum] }, "№"),
            React.createElement(Text, { style: [shared.thText, shared.itemName] }, "Наименование"),
            React.createElement(Text, { style: [shared.thText, shared.itemQty] }, "Кол."),
            React.createElement(Text, { style: [shared.thText, shared.itemUnit] }, "Ед."),
            React.createElement(Text, { style: [shared.thText, shared.itemPrice] }, "Цена"),
            React.createElement(Text, { style: [shared.thText, shared.itemTotal] }, "Сумма"),
          ),
          ...lines.map((ln, i) =>
            React.createElement(View, { key: i, style: i % 2 === 0 ? shared.tableRow : shared.tableRowAlt },
              React.createElement(Text, { style: [shared.tdText, shared.itemNum] }, `${i + 1}`),
              React.createElement(Text, { style: [shared.tdText, shared.itemName] }, ln.name),
              React.createElement(Text, { style: [shared.tdText, shared.itemQty] }, `${ln.qty}`),
              React.createElement(Text, { style: [shared.tdText, shared.itemUnit] }, ln.unit),
              React.createElement(Text, { style: [shared.tdText, shared.itemPrice] }, fmt(ln.price)),
              React.createElement(Text, { style: [shared.tdText, shared.itemTotal] }, fmt(ln.price * ln.qty)),
            )
          ),
        ),
        React.createElement(View, { style: shared.totalRow },
          React.createElement(Text, { style: shared.totalLabel }, "ИТОГО К ОПЛАТЕ:"),
          React.createElement(Text, { style: shared.totalValue }, fmt(d.client_price)),
        ),
        React.createElement(View, { style: { marginTop: 6 } },
          React.createElement(Text, { style: { fontSize: 8, color: "#64748b" } }, "НДС не облагается (УСН, доходы)"),
        ),
      ),

      // Bank details
      React.createElement(View, { style: shared.section },
        React.createElement(Text, { style: shared.sectionTitle }, "Банковские реквизиты"),
        React.createElement(View, { style: [shared.col, { backgroundColor: "#f8fafc" }] },
          ...[
            ["Р/сч", co.bank_account || "—"],
            ["Банк", co.bank_name || "—"],
            ["БИК", co.bik || "—"],
            ["К/сч", co.bank_corr || "—"],
          ].map(([l, v]) => React.createElement(View, { key: l, style: shared.colRow },
            React.createElement(Text, { style: shared.colLabel }, `${l}:`),
            React.createElement(Text, { style: shared.colValue }, v),
          )),
        ),
      ),

      // Signatures
      React.createElement(View, { style: shared.sigRow },
        React.createElement(View, { style: shared.sigBlock },
          React.createElement(View, { style: shared.sigLine },
            React.createElement(Text, { style: shared.sigLabel }, `Исполнитель: ${co.director}`),
          ),
        ),
        React.createElement(View, { style: shared.sigBlock },
          React.createElement(View, { style: shared.sigLine },
            React.createElement(Text, { style: shared.sigLabel }, `Плательщик: ${d.client_name}`),
          ),
        ),
      ),

      // Footer
      React.createElement(View, { style: shared.footer },
        React.createElement(Text, null, "ChinaBridge · chinabridge.pro · info@chinabridge.pro"),
        React.createElement(Text, null, `Счёт №${d.document_number} от ${d.document_date}`),
      ),
    )
  );
}
