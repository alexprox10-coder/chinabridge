import { NextRequest, NextResponse } from "next/server";
import { buildAllDepartments } from "@/lib/ai-company/departments";
import { generateNotifications } from "@/lib/ai-company/ceo/notifications";
import { isAuthorized } from "@/lib/api-auth";

export const runtime     = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const depts = await buildAllDepartments();
  return NextResponse.json({ ok: true, notifications: generateNotifications(depts) });
}
