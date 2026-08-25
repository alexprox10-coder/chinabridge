import { neon } from "@neondatabase/serverless";
import { INTENT_QUERIES } from "./queries";
import { scrapeVkIntentPosts } from "./apify";
import { classifyPost } from "./classifier";
import type { IntentLead, IntentPipelineResult } from "./types";

async function ensureTable(dbUrl: string) {
  const sql = neon(dbUrl);
  await sql`
    CREATE TABLE IF NOT EXISTS vk_intent_leads (
      id          SERIAL PRIMARY KEY,
      post_id     TEXT UNIQUE NOT NULL,
      query       TEXT,
      text        TEXT,
      author_name TEXT,
      author_link TEXT,
      posted_at   TIMESTAMPTZ,
      tier        TEXT,
      score       INT,
      intent      TEXT,
      product     TEXT,
      location    TEXT,
      contact     TEXT,
      urgency     TEXT,
      confidence  REAL,
      source      TEXT DEFAULT 'vk',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

async function saveLead(dbUrl: string, lead: IntentLead): Promise<boolean> {
  const sql = neon(dbUrl);
  try {
    const rows = await sql`
      INSERT INTO vk_intent_leads
        (post_id, query, text, author_name, author_link, posted_at, tier, score,
         intent, product, location, contact, urgency, confidence, source)
      VALUES
        (${lead.post_id}, ${lead.query}, ${lead.text}, ${lead.author_name},
         ${lead.author_link}, ${lead.posted_at}, ${lead.tier}, ${lead.score},
         ${lead.intent}, ${lead.product}, ${lead.location}, ${lead.contact},
         ${lead.urgency}, ${lead.confidence}, ${lead.source})
      ON CONFLICT (post_id) DO NOTHING
      RETURNING id
    `;
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

async function sendTgReport(stats: {
  hot: number;
  warm: number;
  saved: number;
  leads: IntentLead[];
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  const chatId = process.env.TELEGRAM_CHAT_ID ?? "";
  if (!token || !chatId) return;

  const icon = (tier: string) => tier === "HOT" ? "🔥" : "🟡";
  const hotWarmsLeads = stats.leads.filter(l => l.tier === "HOT" || l.tier === "WARM").slice(0, 5);

  let text = `📡 *VK Intent Leads — отчёт за сегодня*\n\n`;
  text += `🔥 HOT: ${stats.hot}  🟡 WARM: ${stats.warm}  💾 Сохранено: ${stats.saved}\n`;

  if (hotWarmsLeads.length > 0) {
    text += `\n*Топ лиды:*\n`;
    for (const l of hotWarmsLeads) {
      text += `\n${icon(l.tier)} *${l.author_name || "Аноним"}* · score ${l.score}\n`;
      text += `🎯 ${l.intent}\n`;
      if (l.product) text += `📦 ${l.product}\n`;
      if (l.location) text += `📍 ${l.location}\n`;
      if (l.contact) text += `📲 ${l.contact}\n`;
      text += `🔗 ${l.author_link}\n`;
    }
  } else {
    text += `\nНовых горячих лидов сегодня не найдено.`;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(8_000),
  }).catch(() => {});
}

interface PipelineOptions {
  postsPerQuery?: number;
  queriesCount?: number;
}

export async function runIntentPipeline(opts: PipelineOptions = {}): Promise<IntentPipelineResult> {
  const { postsPerQuery = 20, queriesCount = 4 } = opts;
  const result: IntentPipelineResult = { scraped: 0, classified: 0, hot: 0, warm: 0, saved: 0, errors: [] };

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    result.errors.push("no DATABASE_URL");
    return result;
  }

  await ensureTable(dbUrl).catch(e => result.errors.push(`table_error: ${String(e)}`));

  const queries = [...INTENT_QUERIES].sort(() => Math.random() - 0.5).slice(0, queriesCount);

  let posts: Awaited<ReturnType<typeof scrapeVkIntentPosts>>;
  try {
    posts = await scrapeVkIntentPosts(queries, postsPerQuery);
    result.scraped = posts.length;
  } catch (err) {
    result.errors.push(`scrape_failed: ${String(err)}`);
    return result;
  }

  const savedLeads: IntentLead[] = [];

  for (const post of posts) {
    try {
      const lead = await classifyPost(post);
      if (!lead) continue;
      result.classified++;
      if (lead.tier === "COLD") continue;
      if (lead.tier === "HOT") result.hot++;
      else result.warm++;
      const wasSaved = await saveLead(dbUrl, lead);
      if (wasSaved) {
        result.saved++;
        savedLeads.push(lead);
      }
    } catch (err) {
      result.errors.push(`classify_error: ${post.post_id}: ${String(err)}`);
    }
  }

  await sendTgReport({ hot: result.hot, warm: result.warm, saved: result.saved, leads: savedLeads });

  return result;
}
