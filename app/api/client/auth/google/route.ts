import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "https://chinabridge.pro"}/client/login?error=oauth_not_configured`
    );
  }

  const state = randomBytes(16).toString("hex");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://chinabridge.pro";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/client/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return res;
}
