import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/partner/login?error=oauth_not_configured", process.env.NEXT_PUBLIC_APP_URL ?? "https://chinabridge.pro")
    );
  }

  const state = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("hex");
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://chinabridge.pro"}/api/partner/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  res.cookies.set("google_oauth_state_partner", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });
  return res;
}
