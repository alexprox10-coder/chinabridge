import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/client-portal/auth";
import { getClientById, updateClientProfile } from "@/lib/client-portal/api";
import { hashPassword as clientHashPassword } from "@/lib/client-portal/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const client = await getClientById(session.clientId);
  if (!client) {
    // Fallback for Google OAuth users whose record may not be in n8n yet
    return NextResponse.json({
      client_id: session.clientId,
      email: session.email,
      name: session.name,
      role: session.role,
      company: "",
      phone: "",
      status: "ACTIVE",
      created_at: new Date().toISOString(),
    });
  }

  const { password_hash: _, ...safe } = client;
  return NextResponse.json(safe);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, company, phone, new_password } = body as {
    name?: string;
    company?: string;
    phone?: string;
    new_password?: string;
  };

  const client = await getClientById(session.clientId);
  if (!client) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const fields: Record<string, string> = {};
  if (name?.trim()) fields.name = name.trim();
  if (company !== undefined) fields.company = company.trim();
  if (phone !== undefined) fields.phone = phone.trim();
  if (new_password?.trim()) {
    fields.password_hash = await clientHashPassword(new_password.trim());
  }

  const ok = await updateClientProfile(client.id, fields as Parameters<typeof updateClientProfile>[1]);
  return NextResponse.json({ ok });
}
