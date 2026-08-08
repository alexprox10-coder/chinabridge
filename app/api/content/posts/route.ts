import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPosts, createPost, updatePost, type PostRow } from "@/lib/content/db";

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
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") || undefined;
    const platform = sp.get("platform") || undefined;
    const limitRaw = sp.get("limit");
    const limit = limitRaw ? Number(limitRaw) : undefined;
    const posts = await getPosts(
      status,
      platform,
      Number.isFinite(limit) ? (limit as number) : undefined,
    );
    return NextResponse.json(posts);
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as Partial<PostRow>;
    if (!body?.body || !String(body.body).trim()) {
      return NextResponse.json({ error: "body_required" }, { status: 400 });
    }
    const id = await createPost(body);
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
    const body = (await req.json()) as Partial<PostRow>;
    await updatePost(id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}

/* Soft delete — the post is kept for analytics, just flagged as rejected. */
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "id_required" }, { status: 400 });
    }
    await updatePost(id, { status: "rejected" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}
