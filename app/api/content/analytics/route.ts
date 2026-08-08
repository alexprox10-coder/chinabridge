import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { neon } from "@neondatabase/serverless";
import { getAnalyticsSummary, getPosts, getSchedule } from "@/lib/content/db";

export const runtime = "nodejs";

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get("cb_admin")?.value);
}

/* Demo funnel — clearly flagged via isDemoData so the UI never passes it off
   as measured data. Replace once Telegram/VK stats are wired in.            */
const DEMO_FUNNEL = {
  telegram: { views: 4820, clicks: 183, registrations: 21, trials: 14, leads: 6, payments: 2 },
  vk: { views: 1930, clicks: 72, registrations: 8, trials: 5, leads: 2, payments: 0 },
  max: { views: 640, clicks: 18, registrations: 2, trials: 1, leads: 0, payments: 0 },
};

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    /* Runs the lazy schema bootstrap before any raw query touches the tables. */
    const schedule = await getSchedule().catch(() => []);

    /* Real counts straight from the posts table. */
    const [statusRows, publishedRows, summary, topPosts] = await Promise.all([
      sql`
        SELECT status, COUNT(*)::int AS c
        FROM content_posts
        WHERE created_at::date = CURRENT_DATE
        GROUP BY status
      ` as Promise<Record<string, unknown>[]>,
      sql`
        SELECT COUNT(*)::int AS c
        FROM content_posts
        WHERE published_at::date = CURRENT_DATE
      ` as Promise<Record<string, unknown>[]>,
      getAnalyticsSummary().catch(() => []),
      getPosts("published", undefined, 20).catch(() => []),
    ]);

    const byStatus: Record<string, number> = {};
    for (const r of statusRows) {
      byStatus[String(r.status)] = Number(r.c) || 0;
    }

    const today = {
      published: Number(publishedRows[0]?.c) || 0,
      generated: byStatus.generated ?? 0,
      approved: byStatus.approved ?? 0,
      scheduled: byStatus.scheduled ?? 0,
    };

    return NextResponse.json({
      ok: true,
      isDemoData: true,
      demoNotice:
        "Цифры воронки — ДЕМО. Счётчики постов реальные (из базы). Подключите статистику Telegram/VK для фактических показов.",
      today,
      summary,
      topPosts: [...topPosts].sort((a, b) => b.clicks - a.clicks).slice(0, 3),
      schedule,
      demoFunnel: DEMO_FUNNEL,
    });
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }
}
