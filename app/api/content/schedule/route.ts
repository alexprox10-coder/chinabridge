import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSchedule, updateSchedule, type ScheduleRow } from "@/lib/content/db";

export const runtime = "nodejs";

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get("cb_admin")?.value);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const schedule = await getSchedule();
    return NextResponse.json(schedule);
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const platform = (req.nextUrl.searchParams.get("platform") ?? "").trim();
    if (!platform) {
      return NextResponse.json({ error: "platform_required" }, { status: 400 });
    }
    const body = (await req.json()) as Partial<ScheduleRow>;

    /* posting_times may arrive as an array — normalise to the stored JSON text. */
    if (Array.isArray((body as { posting_times?: unknown }).posting_times)) {
      body.posting_times = JSON.stringify((body as unknown as { posting_times: string[] }).posting_times);
    }

    await updateSchedule(platform, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}
