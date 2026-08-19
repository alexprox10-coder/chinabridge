import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.INTERNAL_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "INTERNAL_API_KEY not configured" }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://chinabridge.pro";
  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${appUrl}/api/internal/auto-enrich`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({ batchSize: body.batchSize ?? 5 }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
