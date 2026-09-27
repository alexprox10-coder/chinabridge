import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSessionId, setSessionCookie, getIp } from "@/lib/credits/session";
import { getBalance } from "@/lib/credits/db";

export const runtime = "nodejs";

// Admin: GET /api/calc/credits/balance?admin=1&session_id=... requires CALC_ADMIN_SECRET header
function checkAdminSecret(req: NextRequest): boolean {
  const secret = process.env.CALC_ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-secret") === secret;
}

export async function GET(req: NextRequest) {
  // Admin: lookup any session by session_id param
  const url = new URL(req.url);
  const adminLookup = url.searchParams.get("session_id");
  if (adminLookup) {
    if (!checkAdminSecret(req)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "no_db" }, { status: 503 });
    const bal = await getBalance(adminLookup, "admin").catch(() => null);
    return NextResponse.json(bal ?? { error: "not_found" });
  }

  const { session_id, isNew } = getOrCreateSessionId(req);
  const ip = getIp(req);

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      balance: 0, free_used: 0, free_left: 3, has_access: true,
    });
  }

  try {
    const bal = await getBalance(session_id, ip);
    const res = NextResponse.json(bal);
    if (isNew) setSessionCookie(res, session_id);
    return res;
  } catch (err) {
    console.error("[credits/balance]", err);
    // Fail open — let user proceed
    return NextResponse.json({
      balance: 0, free_used: 0, free_left: 3, has_access: true,
    });
  }
}
