import { NextResponse } from "next/server";
import { scrapeTelegramChannel } from "@/lib/vk-intent/telegram";
import { getVkToken } from "@/lib/vk-intent/tokens";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL ?? "";

  // VK token status
  const vkToken = dbUrl ? await getVkToken(dbUrl).catch(() => null) : null;

  // Telegram test — try a known public channel
  const tgPosts = await scrapeTelegramChannel("kargo_china").catch(() => []);

  return NextResponse.json({
    vk_token_saved:  !!vkToken,
    vk_user_id:      vkToken?.user_id ?? null,
    tg_test_channel: "kargo_china",
    tg_posts_found:  tgPosts.length,
    tg_sample:       tgPosts[0]?.text?.slice(0, 100) ?? null,
  });
}
