import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = process.env.VK_ACCESS_TOKEN ?? "";
  if (!token) return NextResponse.json({ error: "VK_ACCESS_TOKEN not set" }, { status: 500 });

  const query = "ищу карго из Китая";
  const params = new URLSearchParams({
    q: query,
    count: "3",
    access_token: token,
    v: "5.199",
    extended: "1",
  });

  try {
    const res = await fetch(`https://api.vk.com/method/newsfeed.search?${params}`, {
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json();
    return NextResponse.json({
      query,
      http_status: res.status,
      vk_error: data.error ?? null,
      items_count: data.response?.items?.length ?? 0,
      total_count: data.response?.total_count ?? 0,
      sample_item: data.response?.items?.[0] ?? null,
      raw_keys: data.response ? Object.keys(data.response) : null,
    });
  } catch (err) {
    return NextResponse.json({ fetch_error: String(err) }, { status: 500 });
  }
}
