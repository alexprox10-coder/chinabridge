import { NextRequest, NextResponse } from "next/server";
import { createTenant } from "@/lib/multitenant/store";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { createTenantSessionToken, hashPin } from "@/lib/crm/auth";
import type { TenantCountry } from "@/lib/multitenant/types";

export const runtime     = "nodejs";
export const maxDuration = 30;

// Simple in-memory rate limiting: max 3 signups per IP per hour
const ipAttempts = new Map<string, { count: number; resetAt: number }>();

async function notifyAdminNewRegistration(data: {
  companyName: string; email: string; country: string; telegram?: string; tenantId: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID ?? "8979087725";
  if (!token) return;

  const text = `🆕 Новая регистрация в ЛК

🏢 Компания: ${data.companyName}
📧 Email: ${data.email}
🌍 Страна: ${data.country}
${data.telegram ? `💬 Telegram: ${data.telegram}\n` : ""}🆔 Tenant: ${data.tenantId}

🔗 https://chinabridge.pro/admin`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  // Rate limiting by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const entry = ipAttempts.get(ip);
  if (entry) {
    if (now < entry.resetAt && entry.count >= 3) {
      return NextResponse.json({ ok: false, error: "Слишком много попыток. Попробуйте через час." }, { status: 429 });
    }
    if (now >= entry.resetAt) ipAttempts.set(ip, { count: 1, resetAt: now + 3_600_000 });
    else entry.count++;
  } else {
    ipAttempts.set(ip, { count: 1, resetAt: now + 3_600_000 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const { companyName, email, password, country, telegram, industry, pin } = body;

  if (!companyName || !email || !password) {
    return NextResponse.json({ ok: false, error: "Необходимы: компания, email, пароль" }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json({ ok: false, error: "Пароль минимум 6 символов" }, { status: 400 });
  }
  if (pin !== undefined && (String(pin).length < 4 || !/^\d+$/.test(String(pin)))) {
    return NextResponse.json({ ok: false, error: "PIN: минимум 4 цифры" }, { status: 400 });
  }

  // Generate unique slug from company name
  const baseSlug = String(companyName)
    .toLowerCase()
    .replace(/[а-яё]/gi, (c: string) => ({ а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"j",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"c",ч:"ch",ш:"sh",щ:"shch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" }[c] ?? c))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  try {
    await ensureSchema();
    const tenantId = `tenant-${slug}-${Date.now()}`;
    const pinHash = pin ? await hashPin(String(pin), tenantId) : undefined;
    const tenant = await createTenant({
      id:           tenantId,
      companyName:  String(companyName),
      slug,
      country:      (country as TenantCountry) ?? "RU",
      currency:     "RUB",
      language:     "ru",
      plan:         "trial",
      owner:        String(email),
      industry:     (industry as "cargo") ?? "cargo",
      description:  `${companyName} — логистика и ВЭД`,
      timezone:     "Europe/Moscow",
      brandColor:   "#2563eb",
      pinHash,
    });

    // Notify admin in Telegram (non-blocking)
    notifyAdminNewRegistration({
      companyName: String(companyName),
      email:       String(email),
      country:     String(country ?? "RU"),
      telegram:    telegram ? String(telegram) : undefined,
      tenantId:    tenant.id,
    });

    // Set auth cookies
    const tenantSessionToken = await createTenantSessionToken(tenant.id);
    const response = NextResponse.json({ ok: true, tenant });
    response.cookies.set("cb_tenant_session",  tenantSessionToken, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
    response.cookies.set("cb_tenant_id",       tenant.id,          { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
    response.cookies.set("cb_onboarding",      "pending",    { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 });
    response.cookies.set("cb_trial_start",     new Date().toISOString(), { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
    response.cookies.set("cb_tenant_email",    String(email), { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
    response.cookies.set("cb_company_name",    String(companyName), { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
    if (telegram) response.cookies.set("cb_telegram", String(telegram), { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });

    return response;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Log full error to Vercel logs for debugging
    console.error("[signup] createTenant error:", e);
    const userMsg = msg.includes("unique") || msg.includes("duplicate")
      ? "Такой email или компания уже зарегистрированы"
      : "Ошибка создания аккаунта. Попробуйте ещё раз";
    return NextResponse.json({ ok: false, error: userMsg }, { status: 500 });
  }
}
