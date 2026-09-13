// AI Enrichment: Product Discovery → Opportunity Score → Reason to Contact → Message
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { outboundLeads } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 60;

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? "";

const CATEGORY_CHINA_MAP: Record<string, { opportunity: string; goods: string; avgPriceGap: string }> = {
  AUTO_ACCESSORIES: {
    opportunity: "автоаксессуары и запчасти",
    goods: "видеорегистраторы, автосигнализации, держатели, чехлы, ароматизаторы",
    avgPriceGap: "35–55%",
  },
  ELECTRONICS: {
    opportunity: "электроника и гаджеты",
    goods: "смартфоны, аксессуары, наушники, умные устройства, зарядки",
    avgPriceGap: "30–50%",
  },
  HOME: {
    opportunity: "товары для дома",
    goods: "органайзеры, посуда, декор, текстиль, освещение",
    avgPriceGap: "40–60%",
  },
  CLOTHING: {
    opportunity: "одежда и обувь",
    goods: "базовые коллекции, сезонные товары, аксессуары",
    avgPriceGap: "45–65%",
  },
  TOOLS: {
    opportunity: "инструменты и оборудование",
    goods: "ручной инструмент, электроинструмент, расходники",
    avgPriceGap: "30–45%",
  },
  CONSUMER_GOODS: {
    opportunity: "потребительские товары",
    goods: "бытовая химия, упаковка, расходные материалы",
    avgPriceGap: "35–50%",
  },
  OTHER: {
    opportunity: "товары широкого спроса",
    goods: "различные товарные категории",
    avgPriceGap: "30–50%",
  },
};

async function callAI(prompt: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "anthropic/claude-haiku-4-5",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(25000),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { outboundId, batchSize = 10 } = body;

    const db = await getDb();
    let leads;

    if (outboundId) {
      leads = await db.select().from(outboundLeads).where(eq(outboundLeads.outboundId, outboundId)).limit(1);
    } else {
      leads = await db.select().from(outboundLeads)
        .where(and(eq(outboundLeads.stage, "FOUND")))
        .limit(batchSize);
    }

    if (!leads.length) return NextResponse.json({ ok: true, processed: 0, message: "No FOUND leads" });

    const results = [];

    for (const lead of leads) {
      try {
        const catInfo = CATEGORY_CHINA_MAP[lead.category] ?? CATEGORY_CHINA_MAP["OTHER"];
        const cityDisplay = lead.city || (lead.country === "KZ" ? "Алматы" : "Москва");
        const marketplace = lead.marketplace !== "NONE" && lead.marketplace ? ` (${lead.marketplace})` : "";

        // Opportunity Score (детерминированный для пилота, без China Match API)
        const baseScore = 50;
        const categoryBonus = lead.category !== "OTHER" ? 20 : 5;
        const contactBonus = lead.phone ? 10 : 0;
        const emailBonus = lead.email ? 5 : 0;
        const websiteBonus = lead.website ? 5 : 0;
        const marketplaceBonus = lead.marketplace !== "NONE" ? 15 : 0;
        const opportunityScore = Math.min(100, baseScore + categoryBonus + contactBonus + emailBonus + websiteBonus + marketplaceBonus);

        // AI: Reason to Contact + Personalized Message
        const prompt = `Ты AI-аналитик компании ChinaBridge — логистика и закупки из Китая.

Данные о компании:
- Название: ${lead.companyName}
- Категория: ${catInfo.opportunity}
- Город: ${cityDisplay}${lead.country === "KZ" ? ", Казахстан" : ", Россия"}
- Маркетплейс${marketplace}: ${lead.marketplace !== "NONE" ? "есть" : "нет данных"}
- Контакт: ${lead.phone ? "телефон есть" : "телефона нет"}${lead.email ? ", email есть" : ""}

Типичные товары в этой категории: ${catInfo.goods}
Потенциальная разница в закупочной цене через Китай: ${catInfo.avgPriceGap} от текущей розничной.

Задача 1: Напиши "Причину обращения" (1-2 предложения) — почему именно этой компании интересно предложить импорт из Китая. Без гарантий и выдуманных цифр.

Задача 2: Напиши первое персональное сообщение (3-4 предложения) для отправки в Telegram/WhatsApp от лица ChinaBridge. Без официоза, конкретно, с предложением показать расчёт. Не начинай со слова "Здравствуйте".

Формат ответа строго JSON:
{"reason": "...", "message": "..."}`;

        const aiText = await callAI(prompt);
        let reason = "";
        let message = "";

        try {
          const jsonMatch = aiText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            reason = parsed.reason ?? "";
            message = parsed.message ?? "";
          }
        } catch {
          reason = aiText.slice(0, 200);
          message = aiText.slice(200, 500);
        }

        const messageQuality = (reason && message) ? 75 : 30;

        await db.update(outboundLeads).set({
          stage: "PERSONALIZED",
          opportunityScore,
          companyScore: opportunityScore - 5,
          reasonToContact: reason,
          personalizedMessage: message,
          messageQualityScore: messageQuality,
          chinaMatchStatus: "UNKNOWN",
          updatedAt: new Date().toISOString(),
        }).where(eq(outboundLeads.outboundId, lead.outboundId));

        results.push({ outboundId: lead.outboundId, company: lead.companyName, opportunityScore, ok: true });
      } catch (err) {
        await db.update(outboundLeads).set({
          stage: "FOUND",
          errorStage: "ENRICH",
          lastError: String(err),
          retryCount: (lead.retryCount ?? 0) + 1,
          updatedAt: new Date().toISOString(),
        }).where(eq(outboundLeads.outboundId, lead.outboundId));

        results.push({ outboundId: lead.outboundId, ok: false, error: String(err) });
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
