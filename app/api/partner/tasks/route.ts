import { NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-portal/auth";
import { getPartnerTasks } from "@/lib/partner-portal/api";

export const runtime = "nodejs";

export async function GET() {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const tasks = await getPartnerTasks(session.partnerId);
  return NextResponse.json(tasks);
}
