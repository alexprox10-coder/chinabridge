import { NextRequest, NextResponse } from "next/server";
import { findClientByEmail } from "@/lib/client-portal/api";
import { hashPassword, createClientToken, CLIENT_COOKIE } from "@/lib/client-portal/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({ email: "", password: "" }));
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const client = await findClientByEmail(email);
  if (!client || client.status !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }

  const hash = await hashPassword(password);
  if (hash !== client.password_hash) {
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }

  const token = await createClientToken({
    clientId: client.client_id,
    email: client.email,
    role: client.role,
    name: client.name,
  });

  const res = NextResponse.json({ ok: true, name: client.name, role: client.role });
  res.cookies.set(CLIENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(CLIENT_COOKIE);
  return res;
}
