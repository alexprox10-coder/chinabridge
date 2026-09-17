import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ADMIN_SECRET = process.env.CALC_ADMIN_SECRET;

// Internal endpoint: only callable with CALC_ADMIN_SECRET header
// Used by internal tools after verified payment. NOT exposed to users.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");

  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const until = new Date();
  until.setDate(until.getDate() + 30);

  const res = NextResponse.json({ ok: true, until: until.toISOString() });
  res.cookies.set("cb_anon_paid_until", until.toISOString(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    expires: until,
    path: "/",
  });
  return res;
}
