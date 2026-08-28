import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
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
