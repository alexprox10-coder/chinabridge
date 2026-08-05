import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime     = "nodejs";
export const maxDuration = 30;

export async function GET() {
  const jar = await cookies();
  const raw = jar.get("cb_ai_config")?.value;

  let config = { activeProvider: "openrouter", defaultModel: "claude-sonnet-4-5", keys: {} };
  if (raw) {
    try { config = JSON.parse(decodeURIComponent(raw)); } catch {}
  }

  return NextResponse.json({ ok: true, config });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // Never log keys — store in httpOnly cookie
  const encoded = encodeURIComponent(JSON.stringify(body));
  const response = NextResponse.json({ ok: true });

  response.cookies.set("cb_ai_config", encoded, {
    path:     "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 365,
  });

  // Also store active provider + model in readable cookie for UI
  if (body.activeProvider) response.cookies.set("cb_ai_provider", body.activeProvider, { path: "/", maxAge: 60*60*24*365 });
  if (body.defaultModel)   response.cookies.set("cb_ai_model",    body.defaultModel,   { path: "/", maxAge: 60*60*24*365 });

  return response;
}
