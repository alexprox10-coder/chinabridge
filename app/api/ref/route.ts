import { NextRequest, NextResponse } from "next/server";
import { recordClick } from "@/lib/partners/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase() ?? "";
  const redirectTo = req.nextUrl.searchParams.get("to") ?? "/";

  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/";
  const res = NextResponse.redirect(new URL(safeRedirect, req.url));

  if (code && /^[A-Z0-9]{4,12}$/.test(code)) {
    res.cookies.set("cb_ref", code, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
    });

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    recordClick(code, ip).catch(() => {});
  }

  return res;
}
