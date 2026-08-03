import { NextResponse } from "next/server";
import React from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { renderToBuffer, Document, Page, Text } = await import("@react-pdf/renderer");
    const doc = React.createElement(Document, {},
      React.createElement(Page, { size: "A4" },
        React.createElement(Text, {}, "Hello PDF")
      )
    );
    const buf = await renderToBuffer(doc);
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "application/pdf" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message + "\n" + e.stack : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
