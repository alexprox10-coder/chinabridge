import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/client-portal/auth";
import { getClientMessages, sendMessage, markManagerMessagesRead } from "@/lib/client-portal/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const orderId = req.nextUrl.searchParams.get("order_id") ?? undefined;
  const messages = await getClientMessages(session.clientId, orderId);

  // Mark manager messages as read
  await markManagerMessagesRead(session.clientId);

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { text, order_id } = await req.json().catch(() => ({ text: "", order_id: undefined }));
  if (!text?.trim()) return NextResponse.json({ error: "empty_message" }, { status: 400 });

  const ok = await sendMessage({
    client_id: session.clientId,
    order_id: order_id ?? undefined,
    author_role: session.role === "CLIENT" ? "CLIENT" : "MANAGER",
    author_name: session.name,
    text: text.trim(),
    is_read: false,
  });

  return NextResponse.json({ ok });
}
