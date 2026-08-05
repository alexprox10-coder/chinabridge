import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAllDepartments } from "@/lib/ai-company/departments";
import { generateNotifications } from "@/lib/ai-company/ceo/notifications";

export const runtime     = "nodejs";
export const maxDuration = 60;

export async function GET(_req: NextRequest) {
  const s = await cookies();
  if (!s.get("cb_admin")?.value) return NextResponse.json({ ok: false }, { status: 401 });
  const depts = await buildAllDepartments();
  return NextResponse.json({ ok: true, notifications: generateNotifications(depts) });
}
