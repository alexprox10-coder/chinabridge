import { NextRequest, NextResponse } from "next/server";
import { findClientByEmail, createClient } from "@/lib/client-portal/api";
import { hashPassword, createClientToken, CLIENT_COOKIE } from "@/lib/client-portal/auth";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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
