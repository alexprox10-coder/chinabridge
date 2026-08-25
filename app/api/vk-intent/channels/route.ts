import { NextRequest, NextResponse } from "next/server";
import { getTgChannels, addTgChannel, removeTgChannel } from "@/lib/vk-intent/tokens";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return NextResponse.json({ error: "no db" }, { status: 500 });
  const channels = await getTgChannels(dbUrl);
  return NextResponse.json(channels);
}

export async function POST(req: NextRequest) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return NextResponse.json({ error: "no db" }, { status: 500 });
  const { username } = await req.json() as { username: string };
  if (!username) return NextResponse.json({ error: "no username" }, { status: 400 });
  await addTgChannel(dbUrl, username);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return NextResponse.json({ error: "no db" }, { status: 500 });
  const { username } = await req.json() as { username: string };
  if (!username) return NextResponse.json({ error: "no username" }, { status: 400 });
  await removeTgChannel(dbUrl, username);
  return NextResponse.json({ ok: true });
}
