import { NextRequest, NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-portal/auth";
import { getTaskById, updateTaskResponse } from "@/lib/partner-portal/api";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await getTaskById(id, session.partnerId);
  if (!task) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await getTaskById(id, session.partnerId);
  if (!task) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as Record<string, string | boolean>;
  const { complete, ...fields } = body as { complete?: boolean } & Record<string, string>;

  const now = new Date().toISOString();
  const ok = await updateTaskResponse(task.id, {
    ...fields,
    status: complete ? "COMPLETED" : "IN_PROGRESS",
    ...(complete ? { completed_at: now } : {}),
  });

  return NextResponse.json({ ok });
}
