import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/api-auth";
import { getAllMessages, sendMessage } from "@/lib/client-portal/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("client_id") ?? undefined;
  const messages = await getAllMessages(clientId);
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, client_id, order_id } = await req.json().catch(() => ({}));
  if (!text?.trim() || !client_id) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const ok = await sendMessage({
    client_id,
    order_id: order_id ?? undefined,
    author_role: "MANAGER",
    author_name: "Менеджер",
    text: text.trim(),
    is_read: false,
  });

  if (!ok) return NextResponse.json({ error: "save_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
