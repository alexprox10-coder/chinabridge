import { NextRequest, NextResponse } from "next/server";
import { handleMessage } from "@/lib/ai/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, message } = body as {
      sessionId?: string;
      message?: string;
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const sid = sessionId && typeof sessionId === "string"
      ? sessionId
      : crypto.randomUUID();

    const result = await handleMessage(sid, message.trim().slice(0, 1000));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[chat/route]", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
