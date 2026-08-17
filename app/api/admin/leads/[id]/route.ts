import { NextRequest, NextResponse } from "next/server";
import { getLead, updateLead, deleteLead } from "@/lib/crm/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLead(Number(id));
  if (!lead) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // Логировать контакт — increment contact_attempts + обновить статус
  if (body.contact_logged) {
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(process.env.DATABASE_URL!);
      const now = new Date().toISOString();
      await sql`
        UPDATE crm_leads
        SET contact_attempts = COALESCE(contact_attempts, 0) + 1,
            last_contact_at = ${now},
            status = CASE WHEN status IN ('NEW', 'RESEARCHED') THEN 'CONTACTED' ELSE status END,
            updated_at = ${now}
        WHERE id = ${Number(id)}
      `;
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  const ok = await updateLead(Number(id), body);
  if (!ok) return NextResponse.json({ error: "update_failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await deleteLead(Number(id));
  if (!ok) return NextResponse.json({ error: "delete_failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
