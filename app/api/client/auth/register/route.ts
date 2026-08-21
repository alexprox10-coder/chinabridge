import { NextRequest, NextResponse } from "next/server";
import { findClientByEmail, createClient } from "@/lib/client-portal/api";
import { hashPassword, createClientToken, CLIENT_COOKIE } from "@/lib/client-portal/auth";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const ipAttempts = new Map<string, { count: number; resetAt: number }>();

async function notifyAdmin(name: string, email: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID ?? "8979087725";
  if (!token) return;
  const text = `🆕 Новая регистрация в ЛК\n\n👤 Имя: ${name}\n📧 Email: ${email}\n\n🔗 https://chinabridge.pro/admin/registrations`;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const entry = ipAttempts.get(ip);
  if (entry) {
    if (now < entry.resetAt && entry.count >= 5) {
      return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
    }
    if (now >= entry.resetAt) ipAttempts.set(ip, { count: 1, resetAt: now + 3_600_000 });
    else entry.count++;
  } else {
    ipAttempts.set(ip, { count: 1, resetAt: now + 3_600_000 });
  }

  const { name, email, password } = await req.json().catch(() => ({})) as {
    name?: string; email?: string; password?: string;
  };

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const existing = await findClientByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const password_hash = await hashPassword(password);
  const clientId = randomUUID();
  const newClient = {
    client_id: clientId,
    email: email.toLowerCase().trim(),
    name: name.trim(),
    password_hash,
    role: "CLIENT" as const,
    status: "ACTIVE" as const,
    company: "",
    phone: "",
  };

  await createClient(newClient);

  // Telegram notification — awaited so Vercel doesn't kill it before fetch completes
  await notifyAdmin(newClient.name, newClient.email);

  const token = await createClientToken({
    clientId,
    email: newClient.email,
    role: newClient.role,
    name: newClient.name,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(CLIENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
