import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { outboundLeads } from "@/lib/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage");
    const country = searchParams.get("country");
    const vertical = searchParams.get("vertical");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const conditions = [];
    if (stage) {
      const stages = stage.split(",");
      conditions.push(inArray(outboundLeads.stage, stages));
    }
    if (country) conditions.push(eq(outboundLeads.country, country));
    if (vertical) conditions.push(eq(outboundLeads.vertical, vertical));

    const rows = await db
      .select()
      .from(outboundLeads)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(outboundLeads.opportunityScore))
      .limit(limit);

    const counts = await db
      .select({ stage: outboundLeads.stage })
      .from(outboundLeads);

    const stageCounts: Record<string, number> = {};
    for (const r of counts) {
      stageCounts[r.stage] = (stageCounts[r.stage] ?? 0) + 1;
    }

    return NextResponse.json({ ok: true, leads: rows, total: counts.length, stageCounts });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json();
    const { outboundId, ...updates } = body;
    if (!outboundId) return NextResponse.json({ ok: false, error: "outboundId required" }, { status: 400 });

    await db
      .update(outboundLeads)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(outboundLeads.outboundId, outboundId));

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
