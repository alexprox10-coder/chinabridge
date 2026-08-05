import { NextRequest, NextResponse } from "next/server";

export const runtime     = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // Save onboarding data — in production update tenant record in DB/n8n
  // Here we persist via cookies for serverless compatibility
  const response = NextResponse.json({ ok: true });

  const { brandColor, currency, mainRoute, telegram, contactEmail, contactPhone, contactWhatsapp } = body;

  if (brandColor)      response.cookies.set("cb_brand_color",      brandColor,      { path: "/", maxAge: 60*60*24*365 });
  if (currency)        response.cookies.set("cb_currency",         currency,        { path: "/", maxAge: 60*60*24*365 });
  if (mainRoute)       response.cookies.set("cb_main_route",       mainRoute,       { path: "/", maxAge: 60*60*24*365 });
  if (telegram)        response.cookies.set("cb_telegram",         telegram,        { path: "/", maxAge: 60*60*24*365 });
  if (contactEmail)    response.cookies.set("cb_contact_email",    contactEmail,    { path: "/", maxAge: 60*60*24*365 });
  if (contactPhone)    response.cookies.set("cb_contact_phone",    contactPhone,    { path: "/", maxAge: 60*60*24*365 });
  if (contactWhatsapp) response.cookies.set("cb_contact_whatsapp", contactWhatsapp, { path: "/", maxAge: 60*60*24*365 });

  // Mark onboarding complete
  response.cookies.set("cb_onboarding", "done", { path: "/", maxAge: 60*60*24*365 });

  return response;
}
