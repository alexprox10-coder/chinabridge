import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import os from "os";
import { isAuthorized } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report: Record<string, unknown> = {};

  // 1. Check local public/fonts
  const localBase = path.join(process.cwd(), "public", "fonts");
  report.cwd = process.cwd();
  report.local_dir_exists = fs.existsSync(localBase);
  report.local_regular_ttf = fs.existsSync(path.join(localBase, "Roboto-Regular.ttf"));

  // 2. Check /tmp
  const tmpDir = path.join(os.tmpdir(), "cb-fonts");
  report.tmp_dir = tmpDir;
  report.tmp_regular_ttf = fs.existsSync(path.join(tmpDir, "Roboto-Regular.ttf"));

  // 3. Try fetching font from public URL
  try {
    const url = "https://chinabridge.pro/fonts/Roboto-Regular.ttf";
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    report.font_url_status = res.status;
    report.font_url_content_type = res.headers.get("content-type");
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      report.font_url_size_bytes = buf.length;
      report.font_url_ok = true;
    } else {
      report.font_url_ok = false;
    }
  } catch (e) {
    report.font_url_error = String(e);
  }

  // 4. Try registerFonts() and generate test PDF
  try {
    const { registerFonts } = await import("@/lib/proposals/pdf/fonts");
    await registerFonts();
    report.register_fonts_ok = true;
  } catch (e) {
    report.register_fonts_error = String(e);
  }

  // 5. Generate minimal test PDF with Cyrillic
  try {
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { Font } = await import("@react-pdf/renderer");
    const React = (await import("react")).default;
    const { Document, Page, Text } = await import("@react-pdf/renderer");

    const doc = React.createElement(Document, null,
      React.createElement(Page, { size: "A4", style: { fontFamily: "Roboto", padding: 40 } },
        React.createElement(Text, null, "Тест кириллицы: Логистика из Китая под ключ")
      )
    );
    const buf = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
    report.test_pdf_size = buf.length;
    report.test_pdf_ok = buf.length > 1000;
  } catch (e) {
    report.test_pdf_error = String(e);
  }

  return NextResponse.json(report);
}
