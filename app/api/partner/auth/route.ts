import { NextRequest, NextResponse } from "next/server";
import { findPartnerByEmail } from "@/lib/partner-portal/api";
import { hashPassword, createPartnerToken, PARTNER_COOKIE } from "@/lib/partner-portal/auth";
import type { Lang } from "@/lib/partner-portal/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password, language } = await req.json().catch(() => ({ email: "", password: "", language: "ru" }));
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const partner = await findPartnerByEmail(email);
  if (!partner || partner.status !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }

  const hash = await hashPassword(password);
  if (hash !== partner.password_hash) {
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }

  const lang: Lang = (language === "zh" ? "zh" : partner.language) ?? "ru";

  const token = await createPartnerToken({
    partnerId: partner.partner_id,
    email: partner.email,
    role: partner.role,
    name: lang === "zh" ? (partner.name_cn || partner.name_ru) : partner.name_ru,
    language: lang,
  });

  const res = NextResponse.json({ ok: true, name: partner.name_ru, role: partner.role });
  res.cookies.set(PARTNER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  res.cookies.set("cb_partner_lang", lang, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(PARTNER_COOKIE);
  return res;
}
