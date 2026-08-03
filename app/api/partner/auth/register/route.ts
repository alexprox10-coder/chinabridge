import { NextRequest, NextResponse } from "next/server";
import { findPartnerByEmail, createPartner } from "@/lib/partner-portal/api";
import { hashPassword, createPartnerToken, PARTNER_COOKIE } from "@/lib/partner-portal/auth";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { name, email, password, language, invite_code } = await req.json().catch(() => ({})) as {
    name?: string; email?: string; password?: string; language?: string; invite_code?: string;
  };

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const expectedCode = process.env.PARTNER_INVITE_CODE;
  if (!expectedCode || invite_code?.trim() !== expectedCode) {
    return NextResponse.json({ error: "invalid_invite_code" }, { status: 403 });
  }

  const existing = await findPartnerByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const password_hash = await hashPassword(password);
  const partnerId = randomUUID();
  const lang = (language === "zh" ? "zh" : "ru") as "ru" | "zh";

  const newPartner = {
    partner_id: partnerId,
    email: email.toLowerCase().trim(),
    password_hash,
    name_ru: name.trim(),
    name_cn: "",
    company: "",
    country: "",
    city: "",
    phone: "",
    wechat: "",
    language: lang,
    role: "PARTNER" as const,
    status: "ACTIVE" as const,
  };

  await createPartner(newPartner);

  const token = await createPartnerToken({
    partnerId,
    email: newPartner.email,
    role: newPartner.role,
    name: newPartner.name_ru,
    language: lang,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PARTNER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  res.cookies.set("cb_partner_lang", lang, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}
