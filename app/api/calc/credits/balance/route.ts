import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSessionId, setSessionCookie, getIp } from "@/lib/credits/session";
import { getBalance } from "@/lib/credits/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
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
