import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { shared } from "./shared-styles";
import type { DocRenderData } from "../types";
import { CURRENCY_SYMBOLS_DOC } from "../types";

const s = StyleSheet.create({
  h1:       { fontSize: 13, fontFamily: "Helvetica-Bold", textAlign: "center", color: "#0f172a", marginBottom: 4 },
  h2:       { fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "center", color: "#475569", marginBottom: 16 },
  cityDate: { textAlign: "right", fontSize: 9, color: "#64748b", marginBottom: 16 },
  p:        { fontSize: 9, color: "#1e293b", lineHeight: 1.7, marginBottom: 6 },
  bold:     { fontFamily: "Helvetica-Bold" },
  secNum:   { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#059669", marginTop: 10, marginBottom: 4 },
  secTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 6 },
  bullet:   { flexDirection: "row", marginBottom: 3 },
  bulletDot:{ fontSize: 9, color: "#059669", width: 14 },
  bulletTxt:{ fontSize: 9, color: "#1e293b", lineHeight: 1.6, flex: 1 },
});

export function ContractPDF(d: DocRenderData) {
  const sym = CURRENCY_SYMBOLS_DOC[d.currency] ?? d.currency;
  const co = d.company;
  const total = d.client_price;

  const bullet = (text: string) =>
    React.createElement(View, { style: s.bullet },
      React.createElement(Text, { style: s.bulletDot }, "•"),
      React.createElement(Text, { style: s.bulletTxt }, text),
    );

  const p = (text: string) => React.createElement(Text, { style: s.p }, text);

  return React.createElement(
    Document, { title: `Договор №${d.document_number}` },
    React.createElement(Page, { size: "A4", style: shared.page },

      // Header logo
      React.createElement(View, { style: { ...shared.header, marginBottom: 14 } },
        React.createElement(Text, { style: shared.logo }, "ChinaBridge"),
        React.createElement(View, null,
          React.createElement(Text, { style: shared.docNum }, `Договор оказания услуг`),
          React.createElement(Text, { style: shared.docNum }, `№ ${d.document_number} от ${d.document_date}`),
        ),
      ),

      React.createElement(Text, { style: s.h1 }, "ДОГОВОР ОКАЗАНИЯ УСЛУГ"),
      React.createElement(Text, { style: s.h2 }, `№ ${d.document_number}`),
      React.createElement(Text, { style: s.cityDate }, `г. Благовещенск · ${d.document_date}`),

      // Preamble
      p(`${co.company_name}, ИНН ${co.inn}, ОГРНИП ${co.ogrnip || "—"}, именуемое в дальнейшем «Исполнитель», в лице ${co.director}, действующего на основании свидетельства о регистрации, с одной стороны, и ${d.client_name}${d.client_inn ? `, ИНН ${d.client_inn}` : ""}, именуемый в дальнейшем «Заказчик», с другой стороны, заключили настоящий договор о нижеследующем:`),

      // Section 1
      React.createElement(Text, { style: s.secNum }, "1."),
      React.createElement(Text, { style: s.secTitle }, "ПРЕДМЕТ ДОГОВОРА"),
      p("1.1. Исполнитель обязуется оказать Заказчику услуги по организации поиска товаров у производителей и поставщиков в Китае, проверке поставщиков, организации выкупа и доставки товара до места назначения Заказчика."),
      p(`1.2. Товар: ${d.product}. Маршрут: ${d.route || "Китай → по согласованию"}. Вес: ${d.weight ? `${d.weight} кг` : "—"}. Объём: ${d.volume ? `${d.volume} м³` : "—"}.`),

      // Section 2
      React.createElement(Text, { style: s.secNum }, "2."),
      React.createElement(Text, { style: s.secTitle }, "ОБЯЗАННОСТИ СТОРОН"),
      p("2.1. Исполнитель обязуется:"),
      bullet("организовать поиск и проверку производителей/поставщиков товара;"),
      bullet("провести проверку качества товара до отгрузки (по согласованию);"),
      bullet("организовать выкуп и доставку товара;"),
      bullet("информировать Заказчика о ходе выполнения услуг;"),
      bullet("контролировать все этапы поставки от выкупа до получения."),
      p("2.2. Заказчик обязуется:"),
      bullet("предоставить полные и достоверные данные о требуемом товаре;"),
      bullet("своевременно осуществить оплату услуг согласно условиям договора;"),
      bullet("принять исполненный заказ и подписать акт выполненных работ."),

      // Footer
      React.createElement(View, { style: shared.footer },
        React.createElement(Text, null, `Договор №${d.document_number} · ChinaBridge`),
        React.createElement(Text, null, "Стр. 1 из 2"),
      ),
    ),

    // Page 2
    React.createElement(Page, { size: "A4", style: shared.page },

      // Section 3
      React.createElement(Text, { style: s.secNum }, "3."),
      React.createElement(Text, { style: s.secTitle }, "СТОИМОСТЬ УСЛУГ И ПОРЯДОК ОПЛАТЫ"),
      p(`3.1. Общая стоимость услуг по настоящему договору составляет: ${sym}${total.toLocaleString("ru-RU")} (${d.currency}).`),
      p(`3.2. В стоимость включено: поиск поставщика — ${sym}${d.goods_cost.toLocaleString("ru-RU")}, доставка — ${sym}${d.delivery_cost.toLocaleString("ru-RU")}${d.services_cost > 0 ? `, дополнительные услуги — ${sym}${d.services_cost.toLocaleString("ru-RU")}` : ""}.`),
      p("3.3. Оплата производится путём авансирования в размере 100% до начала оказания услуг, либо согласно отдельному графику платежей, согласованному сторонами."),
      p("3.4. НДС не облагается в соответствии с применением Исполнителем упрощённой системы налогообложения (УСН)."),

      // Section 4
      React.createElement(Text, { style: s.secNum }, "4."),
      React.createElement(Text, { style: s.secTitle }, "ОТВЕТСТВЕННОСТЬ СТОРОН"),
      p("4.1. Стороны несут ответственность за неисполнение обязательств по договору в соответствии с действующим законодательством РФ."),
      p("4.2. Исполнитель не несёт ответственности за задержки, вызванные действиями третьих лиц (транспортные компании, таможенные органы), обстоятельствами непреодолимой силы."),
      p("4.3. Споры решаются путём переговоров. При недостижении соглашения — в суде по месту нахождения Исполнителя."),

      // Section 5
      React.createElement(Text, { style: s.secNum }, "5."),
      React.createElement(Text, { style: s.secTitle }, "РЕКВИЗИТЫ И ПОДПИСИ СТОРОН"),

      React.createElement(View, { style: shared.twoCol },
        React.createElement(View, { style: shared.col },
          React.createElement(Text, { style: shared.colTitle }, "ИСПОЛНИТЕЛЬ"),
          ...[
            ["Организация", co.company_name],
            ["ИНН", co.inn],
            ["ОГРНИП", co.ogrnip || "—"],
            ["Адрес", co.address],
            ["Р/сч", co.bank_account || "—"],
            ["Банк", co.bank_name || "—"],
            ["БИК", co.bik || "—"],
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
            ["Телефон", d.client_phone || "—"],
            ["E-mail", d.client_email || "—"],
            ["Адрес", d.client_address || "—"],
            ["Компания", d.client_company || "—"],
          ].map(([l, v]) => React.createElement(View, { key: l, style: shared.colRow },
            React.createElement(Text, { style: shared.colLabel }, `${l}:`),
            React.createElement(Text, { style: shared.colValue }, v || "—"),
          )),
        ),
      ),

      React.createElement(View, { style: shared.sigRow },
        React.createElement(View, { style: shared.sigBlock },
          React.createElement(Text, { style: { fontSize: 9, color: "#475569", marginBottom: 4 } }, "Исполнитель:"),
          React.createElement(View, { style: shared.sigLine },
            React.createElement(Text, { style: shared.sigLabel }, co.director),
          ),
        ),
        React.createElement(View, { style: shared.sigBlock },
          React.createElement(Text, { style: { fontSize: 9, color: "#475569", marginBottom: 4 } }, "Заказчик:"),
          React.createElement(View, { style: shared.sigLine },
            React.createElement(Text, { style: shared.sigLabel }, d.client_name),
          ),
        ),
      ),

      React.createElement(View, { style: shared.footer },
        React.createElement(Text, null, "ChinaBridge · chinabridge.pro"),
        React.createElement(Text, null, `Договор №${d.document_number} · Стр. 2 из 2`),
      ),
    )
  );
}
