import { NextRequest, NextResponse } from "next/server";
import { getVkGroups, addVkGroup, removeVkGroup, ensureGroupsTable } from "@/lib/vk-intent/group-tokens";
import { TARGET_GROUPS } from "@/lib/vk-intent/group-comments";

export const dynamic = "force-dynamic";

const DEFAULT_GROUPS = TARGET_GROUPS;

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return NextResponse.json({ error: "no db" }, { status: 500 });

  // Seed defaults if table is empty
  await ensureGroupsTable(dbUrl);
  let groups = await getVkGroups(dbUrl);
  if (groups.length === 0) {
    for (const g of DEFAULT_GROUPS) {
      await addVkGroup(dbUrl, g.id, g.label);
    }
    groups = await getVkGroups(dbUrl);
  }
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return NextResponse.json({ error: "no db" }, { status: 500 });
  const { group_id, label } = await req.json() as { group_id: string; label?: string };
  if (!group_id) return NextResponse.json({ error: "no group_id" }, { status: 400 });
  const ok = await addVkGroup(dbUrl, group_id, label ?? group_id);
  return NextResponse.json({ ok });
}

export async function DELETE(req: NextRequest) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return NextResponse.json({ error: "no db" }, { status: 500 });
  const { group_id } = await req.json() as { group_id: string };
  if (!group_id) return NextResponse.json({ error: "no group_id" }, { status: 400 });
  const ok = await removeVkGroup(dbUrl, group_id);
  return NextResponse.json({ ok });
}
