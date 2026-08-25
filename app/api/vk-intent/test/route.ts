import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ru-RU,ru;q=0.9",
};

export async function GET() {
  const query = "карго из китая";
  const url   = `https://www.avito.ru/rossiya?q=${encodeURIComponent(query)}&s=104`;

  try {
    const res  = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15_000) });
    const html = await res.text();

    const hasItems   = html.includes("data-marker=\"item\"") || html.includes('"items"');
    const titleMatch = html.match(/data-marker="item-title"[^>]*>([^<]{5,100})</);
    const blocked    = html.includes("cloudflare") || html.includes("captcha") || res.status === 403;

    return NextResponse.json({
      http_status:    res.status,
      html_length:    html.length,
      avito_blocked:  blocked,
      has_items:      hasItems,
      sample_title:   titleMatch?.[1]?.trim() ?? null,
      url,
    });
  } catch (e) {
    return NextResponse.json({ fetch_error: String(e) }, { status: 500 });
  }
}
