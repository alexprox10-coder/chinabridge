import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { shared } from "./shared-styles";
import type { DocRenderData } from "../types";
import { CURRENCY_SYMBOLS_DOC } from "../types";

const s = StyleSheet.create({
  enTitle:  { fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "center", color: "#0f172a", marginBottom: 4 },
  enSub:    { fontSize: 9, textAlign: "center", color: "#64748b", marginBottom: 16 },
  boxTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#059669", marginBottom: 5, textTransform: "uppercase" },
});

export function InvoiceImportPDF(d: DocRenderData) {
  const sym = CURRENCY_SYMBOLS_DOC[d.currency] ?? d.currency;
  const fmt = (n: number) => `${sym}${(n ?? 0).toLocaleString("en-US")}`;
  const co = d.company;

  return React.createElement(
    Document, { title: `Invoice ${d.document_number}` },
    React.createElement(Page, { size: "A4", style: shared.page },

      // Header
      React.createElement(View, { style: shared.header },
        React.createElement(Text, { style: shared.logo }, "ChinaBridge"),
        React.createElement(View, null,
          React.createElement(Text, { style: shared.docTitle }, "COMMERCIAL INVOICE"),
          React.createElement(Text, { style: shared.docNum }, `No. ${d.document_number} · Date: ${d.document_date}`),
        ),
      ),

      React.createElement(Text, { style: s.enSub }, "International Commercial Invoice for Customs Clearance"),

      // Parties
      React.createElement(View, { style: shared.twoCol },
        React.createElement(View, { style: shared.col },
          React.createElement(Text, { style: s.boxTitle }, "SELLER / ПРОДАВЕЦ"),
          ...[
            ["Company", co.company_name],
            ["INN", co.inn],
            ["Address", co.address],
            ["Email", co.email],
            ["Phone", co.phone || "—"],
          ].map(([l, v]) => React.createElement(View, { key: l, style: shared.colRow },
            React.createElement(Text, { style: shared.colLabel }, `${l}:`),
            React.createElement(Text, { style: shared.colValue }, v || "—"),
          )),
        ),
        React.createElement(View, { style: shared.col },
          React.createElement(Text, { style: s.boxTitle }, "BUYER / ПОКУПАТЕЛЬ"),
          ...[
            ["Name", d.client_name],
            ["INN", d.client_inn || "—"],
            ["Address", d.client_address || "—"],
            ["Email", d.client_email || "—"],
            ["Phone", d.client_phone || "—"],
          ].map(([l, v]) => React.createElement(View, { key: l, style: shared.colRow },
            React.createElement(Text, { style: shared.colLabel }, `${l}:`),
            React.createElement(Text, { style: shared.colValue }, v || "—"),
          )),
        ),
      ),

      // Shipment info
      React.createElement(View, { style: [shared.col, { marginBottom: 12, flexDirection: "row", gap: 16 }] },
        ...[
          ["Route", d.route || "China → Russia/Kazakhstan"],
          ["Weight", d.weight ? `${d.weight} kg` : "—"],
          ["Volume", d.volume ? `${d.volume} m³` : "—"],
          ["Currency", d.currency],
          ["Terms", "EXW"],
        ].map(([l, v]) => React.createElement(View, { key: l, style: { flex: 1 } },
          React.createElement(Text, { style: { fontSize: 8, color: "#64748b" } }, l),
          React.createElement(Text, { style: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#0f172a", marginTop: 2 } }, v),
        )),
      ),

      // Goods table
      React.createElement(View, { style: shared.table },
        React.createElement(View, { style: shared.tableHeader },
          React.createElement(Text, { style: [shared.thText, shared.itemNum] }, "No."),
          React.createElement(Text, { style: [shared.thText, shared.itemName] }, "Description of Goods"),
          React.createElement(Text, { style: [shared.thText, shared.itemQty] }, "Qty"),
          React.createElement(Text, { style: [shared.thText, shared.itemPrice] }, "Unit Price"),
          React.createElement(Text, { style: [shared.thText, shared.itemTotal] }, "Amount"),
        ),
        React.createElement(View, { style: shared.tableRow },
          React.createElement(Text, { style: [shared.tdText, shared.itemNum] }, "1"),
          React.createElement(Text, { style: [shared.tdText, shared.itemName] }, d.product),
          React.createElement(Text, { style: [shared.tdText, shared.itemQty] }, d.quantity || "1"),
          React.createElement(Text, { style: [shared.tdText, shared.itemPrice] }, fmt(d.goods_cost)),
          React.createElement(Text, { style: [shared.tdText, shared.itemTotal] }, fmt(d.goods_cost)),
        ),
        React.createElement(View, { style: shared.tableRowAlt },
          React.createElement(Text, { style: [shared.tdText, shared.itemNum] }, "2"),
          React.createElement(Text, { style: [shared.tdText, shared.itemName] }, "Freight & Logistics"),
          React.createElement(Text, { style: [shared.tdText, shared.itemQty] }, "1"),
          React.createElement(Text, { style: [shared.tdText, shared.itemPrice] }, fmt(d.delivery_cost)),
          React.createElement(Text, { style: [shared.tdText, shared.itemTotal] }, fmt(d.delivery_cost)),
        ),
      ),
      React.createElement(View, { style: shared.totalRow },
        React.createElement(Text, { style: shared.totalLabel }, "TOTAL AMOUNT:"),
        React.createElement(Text, { style: shared.totalValue }, fmt(d.client_price)),
      ),
      React.createElement(Text, { style: { fontSize: 8, color: "#64748b", marginTop: 5, marginBottom: 14 } },
        "This invoice is issued for customs clearance purposes. All amounts in " + d.currency + "."
      ),

      // Signatures
      React.createElement(View, { style: shared.sigRow },
        React.createElement(View, { style: shared.sigBlock },
          React.createElement(Text, { style: { fontSize: 9, color: "#475569", marginBottom: 4 } }, "Seller Signature / Подпись продавца:"),
          React.createElement(View, { style: shared.sigLine },
            React.createElement(Text, { style: shared.sigLabel }, co.director),
          ),
        ),
        React.createElement(View, { style: shared.sigBlock },
          React.createElement(Text, { style: { fontSize: 9, color: "#475569", marginBottom: 4 } }, "Buyer Signature / Подпись покупателя:"),
          React.createElement(View, { style: shared.sigLine },
            React.createElement(Text, { style: shared.sigLabel }, d.client_name),
          ),
        ),
      ),

      React.createElement(View, { style: shared.footer },
        React.createElement(Text, null, "ChinaBridge · chinabridge.pro"),
        React.createElement(Text, null, `Invoice No. ${d.document_number} · ${d.document_date}`),
      ),
    )
  );
}
