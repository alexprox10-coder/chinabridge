import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = process.env.VK_ACCESS_TOKEN ?? "";
  if (!token) return NextResponse.json({ error: "VK_ACCESS_TOKEN not set" }, { status: 500 });

  // Test groups.search
  const gParams = new URLSearchParams({ q: "карго китай", count: "3", type: "group", access_token: token, v: "5.199" });
  const gRes    = await fetch(`https://api.vk.com/method/groups.search?${gParams}`, { signal: AbortSignal.timeout(10_000) });
  const gData   = await gRes.json();

  const groupId = gData.response?.items?.[0]?.id;
  let wallResult = null;

  if (groupId) {
    // Test wall.search on first found group
    const wParams = new URLSearchParams({ owner_id: String(-groupId), query: "карго", count: "3", access_token: token, v: "5.199" });
    const wRes    = await fetch(`https://api.vk.com/method/wall.search?${wParams}`, { signal: AbortSignal.timeout(10_000) });
    const wData   = await wRes.json();
    wallResult = {
      group_id: groupId,
      group_name: gData.response.items[0].name,
      wall_error: wData.error ?? null,
      wall_items: wData.response?.items?.length ?? 0,
      sample_text: wData.response?.items?.[0]?.text?.slice(0, 100) ?? null,
    };
  }

  return NextResponse.json({
    groups_error:  gData.error ?? null,
    groups_found:  gData.response?.items?.length ?? 0,
    first_group:   gData.response?.items?.[0]?.name ?? null,
    wall_test:     wallResult,
  });
}
