import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [{ renderToBuffer }, { GuideDocument }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/lib/documents/pdf/free-guide"),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(GuideDocument() as any);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="china-import-calculator-guide.pdf"',
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "pdf_failed", detail: msg }, { status: 500 });
  }
}
