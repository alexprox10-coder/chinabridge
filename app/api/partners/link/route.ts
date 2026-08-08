import { NextRequest, NextResponse } from "next/server";
import { isAuthorized, getTenantId } from "@/lib/api-auth";
import { getOrCreateLink } from "@/lib/partners/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = getTenantId(req);

  try {
    const { code } = await getOrCreateLink(tenantId);
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://chinabridge.pro";
    const url = `${base}/api/ref?code=${code}`;
    return NextResponse.json({ ok: true, code, url });
  } catch (e) {
    console.error("[partners/link]", e);
    return NextResponse.json({ ok: false, error: "Ошибка создания ссылки" }, { status: 500 });
  }
}
