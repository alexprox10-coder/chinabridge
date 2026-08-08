import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAdChannels,
  createAdChannel,
  updateAdChannel,
  type AdChannelRow,
} from "@/lib/content/db";

export const runtime = "nodejs";

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get("cb_admin")?.value);
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const status = req.nextUrl.searchParams.get("status") || undefined;
    const channels = await getAdChannels(status);
    return NextResponse.json(channels);
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as Partial<AdChannelRow>;
    if (!body?.name || !String(body.name).trim()) {
      return NextResponse.json({ error: "name_required" }, { status: 400 });
    }
    const id = await createAdChannel(body);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "id_required" }, { status: 400 });
    }
    const body = (await req.json()) as Partial<AdChannelRow>;
    await updateAdChannel(id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}
