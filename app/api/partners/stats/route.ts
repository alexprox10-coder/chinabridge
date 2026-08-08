import { NextRequest, NextResponse } from "next/server";
import { isAuthorized, getTenantId } from "@/lib/api-auth";
import { getStats } from "@/lib/partners/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = getTenantId(req);

  try {
    const stats = await getStats(tenantId);
    if (!stats) {
      return NextResponse.json({ ok: true, has_link: false });
    }
    return NextResponse.json({ ok: true, has_link: true, ...stats });
  } catch (e) {
    console.error("[partners/stats]", e);
    return NextResponse.json({ ok: false, error: "Ошибка загрузки статистики" }, { status: 500 });
  }
}
