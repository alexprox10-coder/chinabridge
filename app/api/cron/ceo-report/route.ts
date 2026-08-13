import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cronHeader = req.headers.get("x-vercel-cron");
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET ?? "chinabridge-cron";
  if (!cronHeader && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Вызываем основной API генерации отчёта с системным токеном
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://chinabridge.pro";
  try {
    const res = await fetch(`${baseUrl}/api/admin/ceo-report`, {
      method: "POST",
      headers: { cookie: `cb_admin=${process.env.ADMIN_SECRET ?? ""}` },
    });
    const data = await res.json();
    console.log("[ceo-report cron]", data.ok ? "OK" : data.error);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
