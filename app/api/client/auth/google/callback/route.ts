import { NextRequest, NextResponse } from "next/server";
import { findClientByEmail, createClient } from "@/lib/client-portal/api";
import { createClientToken, CLIENT_COOKIE } from "@/lib/client-portal/auth";
import { randomUUID } from "crypto";
import type { ClientRole } from "@/lib/client-portal/types";

export const runtime = "nodejs";

function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(CLIENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://chinabridge.pro";
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = req.cookies.get("google_oauth_state")?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/client/login?error=oauth_failed`);
  }

  try {
    // Exchange code → tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: `${appUrl}/api/client/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${appUrl}/client/login?error=oauth_failed`);
    }

    const { access_token } = await tokenRes.json() as { access_token: string };

    // Get Google profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!profileRes.ok) {
      return NextResponse.redirect(`${appUrl}/client/login?error=oauth_failed`);
    }

    const profile = await profileRes.json() as { email?: string; name?: string };
    const email = profile.email?.toLowerCase().trim();

    if (!email) {
      return NextResponse.redirect(`${appUrl}/client/login?error=no_email`);
    }

    // Try to find existing client
    const existing = await findClientByEmail(email);

    if (existing) {
      // Existing user — check status
      if (existing.status !== "ACTIVE") {
        return NextResponse.redirect(`${appUrl}/client/login?error=account_inactive`);
      }
      const token = await createClientToken({
        clientId: existing.client_id,
        email: existing.email,
        role: existing.role,
        name: existing.name,
      });
      const res = NextResponse.redirect(`${appUrl}/client/dashboard`);
      res.cookies.delete("google_oauth_state");
      setSessionCookie(res, token);
      return res;
    }

    // New user — auto-register, use local data for session (don't rely on n8n response structure)
    const newClient = {
      client_id: randomUUID(),
      email,
      name: profile.name ?? email.split("@")[0],
      company: "",
      phone: "",
      password_hash: "",
      role: "CLIENT" as ClientRole,
      status: "ACTIVE" as const,
    };

    await createClient(newClient); // save to n8n (best-effort)

    const token = await createClientToken({
      clientId: newClient.client_id,
      email: newClient.email,
      role: newClient.role,
      name: newClient.name,
    });

    const res = NextResponse.redirect(`${appUrl}/client/dashboard`);
    res.cookies.delete("google_oauth_state");
    setSessionCookie(res, token);
    return res;

  } catch {
    return NextResponse.redirect(`${appUrl}/client/login?error=oauth_failed`);
  }
}
