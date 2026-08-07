import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { verifyPin, createTenantSessionToken } from "@/lib/crm/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, pin } = await req.json().catch(() => ({ email: "", pin: "" }));

  if (!email || !pin) {
    return NextResponse.json({ ok: false, error: "email и PIN обязательны" }, { status: 400 });
  }
  if (!/^\d{4,8}$/.test(String(pin))) {
    return NextResponse.json({ ok: false, error: "PIN должен содержать 4–8 цифр" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`SELECT id, pin_hash, plan, status FROM tenants WHERE owner = ${String(email)} LIMIT 1`;

  if (!rows.length || !rows[0].pin_hash) {
    return NextResponse.json({ ok: false, error: "Аккаунт не найден или PIN не установлен" }, { status: 401 });
  }

  const row = rows[0];
  const valid = await verifyPin(String(pin), String(row.pin_hash), String(row.id));
  if (!valid) {
    return NextResponse.json({ ok: false, error: "Неверный PIN" }, { status: 401 });
  }

  // Check plan access: trial or paid
  const allowed = row.status === "trial" || row.status === "active";
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Подписка приостановлена" }, { status: 403 });
  }

  const tenantSessionToken = await createTenantSessionToken(String(row.id));
  const res = NextResponse.json({ ok: true });
  res.cookies.set("cb_tenant_session", tenantSessionToken, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  res.cookies.set("cb_tenant_id",      String(row.id),    { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
