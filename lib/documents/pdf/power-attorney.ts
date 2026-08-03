import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { shared } from "./shared-styles";
import type { DocRenderData } from "../types";

const s = StyleSheet.create({
  center:  { textAlign: "center" },
  title:   { fontSize: 15, fontFamily: "Helvetica-Bold", textAlign: "center", color: "#0f172a", marginBottom: 6, letterSpacing: 2 },
  num:     { fontSize: 9, textAlign: "center", color: "#64748b", marginBottom: 20 },
  body:    { fontSize: 9, color: "#1e293b", lineHeight: 1.8, marginBottom: 8 },
  indent:  { marginLeft: 16 },
  bold:    { fontFamily: "Helvetica-Bold" },
  box:     { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4, padding: 10, marginVertical: 10 },
  boxLine: { flexDirection: "row", marginBottom: 3 },
  boxLbl:  { fontSize: 8, color: "#64748b", width: 90 },
  boxVal:  { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#0f172a", flex: 1 },
});

export function PowerAttorneyPDF(d: DocRenderData) {
  const co = d.company;

  const cityDate = `г. Благовещенск, ${d.document_date}`;

  const p = (text: string, style = s.body) => React.createElement(Text, { style }, text);

  return React.createElement(
    Document, { title: `Доверенность №${d.document_number}` },
    React.createElement(Page, { size: "A4", style: shared.page },

      // Header
      React.createElement(View, { style: { ...shared.header, marginBottom: 12 } },
        React.createElement(Text, { style: shared.logo }, "ChinaBridge"),
        React.createElement(Text, { style: shared.docNum }, `№ ${d.document_number} · ${d.document_date}`),
      ),

      React.createElement(Text, { style: s.title }, "ДОВЕРЕННОСТЬ"),
      React.createElement(Text, { style: s.num }, cityDate),

      // Grantor
      p(`${co.company_name}, ИНН ${co.inn}, ОГРНИП ${co.ogrnip || "—"}, адрес: ${co.address}, в лице ${co.director}, именуемое в дальнейшем «Доверитель», настоящей доверенностью уполномочивает:`),

      // Grantee
      React.createElement(View, { style: s.box },
        React.createElement(Text, { style: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#059669", marginBottom: 6, textTransform: "uppercase" } }, "Уполномоченное лицо / Поверенный"),
        ...[
          ["ФИО", d.client_name],
          ["Телефон", d.client_phone || "—"],
          ["Email", d.client_email || "—"],
          ["Адрес", d.client_address || `Клиент: ${d.client_name}`],
        ].map(([l, v]) => React.createElement(View, { key: l, style: s.boxLine },
          React.createElement(Text, { style: s.boxLbl }, `${l}:`),
          React.createElement(Text, { style: s.boxVal }, v || "—"),
        )),
      ),

      p("совершать от имени Доверителя следующие действия:"),

      // Powers granted
      ...[
        `1. Получать товар — ${d.product} — у транспортных компаний, экспедиторов, на складах временного хранения.`,
        `2. Подписывать документы, связанные с приёмкой, хранением и транспортировкой вышеуказанного товара.`,
        `3. Вести переговоры и взаимодействовать с поставщиками, логистическими компаниями и таможенными органами по вопросам поставки.`,
        `4. Оплачивать складские, транспортные и таможенные расходы из средств Доверителя.`,
        `5. Расписываться за Доверителя во всех документах, необходимых для реализации полномочий по настоящей доверенности.`,
      ].map((text, i) => p(text, { ...s.body, ...s.indent })),

      p(`Доверенность выдана в отношении сделки по доставке товара (${d.product}) по маршруту: ${d.route || "Китай — Россия/Казахстан"}.`),
      p("Настоящая доверенность выдана сроком на 1 (один) год с даты подписания."),
      p("Передоверие не допускается."),

      // Signature block
      React.createElement(View, { style: { marginTop: 30, flexDirection: "row", justifyContent: "space-between" } },
        React.createElement(View, { style: { width: "50%" } },
          React.createElement(Text, { style: { fontSize: 9, color: "#475569", marginBottom: 4 } }, "Доверитель:"),
          React.createElement(View, { style: shared.sigLine },
            React.createElement(Text, { style: shared.sigLabel }, co.director),
          ),
          React.createElement(Text, { style: { fontSize: 8, color: "#94a3b8", marginTop: 3 } }, "М.П."),
        ),
        React.createElement(View, { style: { width: "40%" } },
          React.createElement(Text, { style: { fontSize: 9, color: "#475569", marginBottom: 4 } }, "Поверенный подпись:"),
          React.createElement(View, { style: shared.sigLine },
            React.createElement(Text, { style: shared.sigLabel }, d.client_name),
          ),
        ),
      ),

      React.createElement(View, { style: shared.footer },
        React.createElement(Text, null, "ChinaBridge · chinabridge.pro"),
        React.createElement(Text, null, `Доверенность №${d.document_number}`),
      ),
    )
  );
}
