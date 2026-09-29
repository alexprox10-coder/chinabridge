import { NextRequest, NextResponse } from "next/server";
import { getAuditTrail } from "@/lib/docs/audit_trail";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ records: [] });
  const records = await getAuditTrail(id);
  return NextResponse.json({ records });
}
