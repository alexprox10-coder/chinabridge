import { NextResponse } from "next/server";

const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "";
const HOST = "https://chinabridge.pro";

// Все публичные SEO-страницы для пинга
const ALL_PAGES = [
  `${HOST}/`,
  `${HOST}/delivery`,
  `${HOST}/delivery/import-electronics-from-china`,
  `${HOST}/delivery/cargo-guangzhou-almaty`,
  `${HOST}/delivery/white-import-wb-ozon`,
  `${HOST}/delivery/pay-supplier-china`,
  `${HOST}/delivery/cargo-china-moscow`,
  `${HOST}/services`,
  `${HOST}/services/china-delivery`,
  `${HOST}/faq`,
];

export async function POST(req: Request) {
  if (!INDEXNOW_KEY) {
    return NextResponse.json({ error: "INDEXNOW_KEY not set" }, { status: 500 });
  }

  let urls: string[] = ALL_PAGES;
  try {
    const body = await req.json();
    if (Array.isArray(body.urls)) urls = body.urls;
  } catch {
    // use default urls
  }

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host: HOST.replace("https://", ""),
      key: INDEXNOW_KEY,
      keyLocation: `${HOST}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json({ error: `IndexNow ${res.status}`, detail: text }, { status: 502 });
  }

  return NextResponse.json({ ok: true, submitted: urls.length, urls });
}

// GET — просто показывает статус
export async function GET() {
  return NextResponse.json({
    status: "IndexNow endpoint active",
    key_configured: !!INDEXNOW_KEY,
    pages: ALL_PAGES.length,
    usage: "POST /api/indexnow to submit all pages to Bing",
  });
}
