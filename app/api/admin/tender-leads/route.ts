import { NextRequest, NextResponse } from "next/server";
import {
  ensureTenderSchema, getOpportunities, updateOpportunityStatus, getDailyStats,
} from "@/lib/tender/db";
import type { OpportunityStatus } from "@/lib/tender/types";

export const dynamic = "force-dynamic";

// GET /api/admin/tender-leads?status=HOT&priority=HIGH&page=1&limit=50
export async function GET(req: NextRequest) {
  try {
    await ensureTenderSchema();
    const p = req.nextUrl.searchParams;

    const [{ rows, total }, stats] = await Promise.all([
      getOpportunities({
        status:    p.get("status")    ?? undefined,
        priority:  p.get("priority")  ?? undefined,
        law_type:  p.get("law_type")  ?? undefined,
        stream:    p.get("stream")    ?? undefined,
        min_fit:   p.get("min_fit")   ? parseInt(p.get("min_fit")!)   : undefined,
        min_score: p.get("min_score") ? parseInt(p.get("min_score")!) : undefined,
        page:      p.get("page")      ? parseInt(p.get("page")!)      : 1,
        limit:     p.get("limit")     ? parseInt(p.get("limit")!)     : 50,
      }),
      getDailyStats(),
    ]);

    return NextResponse.json({ ok: true, rows, total, stats });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// PATCH /api/admin/tender-leads — update status or feedback
export async function PATCH(req: NextRequest) {
  try {
    const { id, status, feedback } = await req.json() as {
      id: string;
      status: OpportunityStatus;
      feedback?: string;
    };
    if (!id || !status) {
      return NextResponse.json({ ok: false, error: "id and status required" }, { status: 400 });
    }
    await updateOpportunityStatus(id, status, feedback);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
