import { NextRequest, NextResponse } from "next/server";
import { findPartnerByEmail, createPartner } from "@/lib/partner-portal/api";
import { createPartnerToken, PARTNER_COOKIE } from "@/lib/partner-portal/auth";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

function setPartnerCookie(res: NextResponse, token: string) {
  res.cookies.set(PARTNER_COOKIE, token, {
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
  const storedState = req.cookies.get("google_oauth_state_partner")?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/partner/login?error=oauth_failed`);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: `${appUrl}/api/partner/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${appUrl}/partner/login?error=oauth_failed`);
    }

    const { access_token } = await tokenRes.json() as { access_token: string };

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!profileRes.ok) {
      return NextResponse.redirect(`${appUrl}/partner/login?error=oauth_failed`);
    }

    const profile = await profileRes.json() as { email?: string; name?: string };
    const email = profile.email?.toLowerCase().trim();

    if (!email) {
      return NextResponse.redirect(`${appUrl}/partner/login?error=no_email`);
    }

    const existing = await findPartnerByEmail(email);

    if (existing) {
      if (existing.status !== "ACTIVE") {
        return NextResponse.redirect(`${appUrl}/partner/login?error=account_inactive`);
      }
      const token = await createPartnerToken({
        partnerId: existing.partner_id,
        email: existing.email,
        role: existing.role,
        name: existing.name_ru,
        language: existing.language ?? "ru",
      });
      const res = NextResponse.redirect(`${appUrl}/partner/dashboard`);
      res.cookies.delete("google_oauth_state_partner");
      setPartnerCookie(res, token);
      return res;
    }

    // New partner — auto-register
    const partnerId = randomUUID();
    const newPartner = {
      partner_id: partnerId,
      email,
      name_ru: profile.name ?? email.split("@")[0],
      name_cn: "",
      company: "",
      country: "",
      city: "",
      phone: "",
      wechat: "",
      password_hash: "",
      language: "ru" as const,
      role: "PARTNER" as const,
      status: "ACTIVE" as const,
    };

    await createPartner(newPartner);

    const token = await createPartnerToken({
      partnerId,
      email: newPartner.email,
      role: newPartner.role,
      name: newPartner.name_ru,
      language: newPartner.language,
    });

    const res = NextResponse.redirect(`${appUrl}/partner/dashboard`);
    res.cookies.delete("google_oauth_state_partner");
    setPartnerCookie(res, token);
    return res;

  } catch {
    return NextResponse.redirect(`${appUrl}/partner/login?error=oauth_failed`);
  }
}
