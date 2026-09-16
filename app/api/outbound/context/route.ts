// §23 ТЗ — Load ai_consultant_context for AI Consultant handoff
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT ai_consultant_context, company_name, category, opportunity_score
      FROM outbound_leads WHERE outbound_id = ${id} LIMIT 1
    `;
    if (!rows.length) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    return NextResponse.json({ ok: true, context: rows[0].ai_consultant_context, company_name: rows[0].company_name, category: rows[0].category, opportunity_score: rows[0].opportunity_score });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
