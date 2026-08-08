import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTopics, createTopic, updateTopic, type TopicRow } from "@/lib/content/db";

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
    const topics = await getTopics(status);
    return NextResponse.json(topics);
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as Partial<TopicRow>;
    if (!body?.title || !String(body.title).trim()) {
      return NextResponse.json({ error: "title_required" }, { status: 400 });
    }
    const id = await createTopic(body);
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
    const body = (await req.json()) as Partial<TopicRow>;
    await updateTopic(id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}
