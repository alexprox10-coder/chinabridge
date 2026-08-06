import { NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-portal/auth";
import { getPartnerTasks } from "@/lib/partner-portal/api";
import { getDeletedPartnerTaskIds } from "@/lib/partner-portal/status-store";

export const runtime = "nodejs";

export async function GET() {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [tasks, deletedIds] = await Promise.all([
    getPartnerTasks(session.partnerId),
    getDeletedPartnerTaskIds().catch(() => new Set<string>()),
  ]);

  const filtered = tasks.filter(t => !deletedIds.has(t.task_id));
  return NextResponse.json(filtered);
}
