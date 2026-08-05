import { NextRequest, NextResponse } from "next/server";

export const runtime     = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  if (!body.version || !body.exportedAt) {
    return NextResponse.json({ ok: false, error: "Неверный формат бэкапа" }, { status: 400 });
  }

  const settings = (body.settings ?? {}) as Record<string, string>;
  const response = NextResponse.json({
    ok:       true,
    restored: `${Object.keys(settings).length} настроек`,
  });

  // Restore cookies from backup
  const EXCLUDE = ["cb_admin", "cb_super_admin", "cb_ai_config"];
  for (const [name, value] of Object.entries(settings)) {
    if (name.startsWith("cb_") && !EXCLUDE.includes(name)) {
      response.cookies.set(name, String(value), { path: "/", maxAge: 60 * 60 * 24 * 365 });
    }
  }

  return response;
}
