import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMILeads, getMILeadStats, updateMILeadPipeline } from "@/lib/market-intelligence/db";
import { runLeadFinder } from "@/lib/market-intelligence/lead-finder";
import { createLead } from "@/lib/crm/client";
import type { MILeadPipeline, MILead } from "@/lib/market-intelligence/types";
import { MI_LEAD_TYPE_LABELS } from "@/lib/market-intelligence/types";

export const runtime     = "nodejs";
export const maxDuration = 120;
export const dynamic     = "force-dynamic";

async function getTenantId() {
  const store = await cookies();
  return store.get("cb_tenant_id")?.value ?? "tenant-chinabridge";
}

function buildMIComment(l: MILead): string {
  const lines: string[] = [];

  lines.push("🏢 АНАЛИТИКА КОМПАНИИ (Lead Finder AI)");
  lines.push(`${l.company} — ${MI_LEAD_TYPE_LABELS[l.type]} | ${l.city || ""}${l.city && l.country ? ", " : ""}${l.country || ""}`);
  if (l.website)  lines.push(`Сайт: ${l.website}`);
  if (l.phone)    lines.push(`Телефон: ${l.phone}`);
  if (l.email)    lines.push(`Email: ${l.email}`);
  if (l.telegram) lines.push(`Telegram: ${l.telegram}`);
  lines.push(`AI Score: ${l.score}/100 | ${l.temperature}`);
  lines.push(`Источник: ${l.source}${l.sourceUrl ? ` — ${l.sourceUrl}` : ""}`);
  lines.push("");

  if (l.description) {
    lines.push("📊 ОПИСАНИЕ");
    lines.push(l.description);
    lines.push("");
  }

  if (l.scoreReason) {
    lines.push("💡 ПОЧЕМУ ИНТЕРЕСНЫ");
    lines.push(l.scoreReason);
    lines.push("");
  }

  if (l.nextAction) {
    lines.push("🎯 РЕКОМЕНДОВАННЫЙ СЛЕДУЮЩИЙ ШАГ");
    lines.push(l.nextAction);
    lines.push("");
  }

  lines.push("✅ ПЛАН РАБОТЫ");
  lines.push("1. Изучить компанию и её текущую схему работы");
  lines.push("2. Найти контакт — позвонить или написать в Telegram");
  lines.push("3. Выявить потребность в импорте / логистике из Китая");
  lines.push("4. Подготовить расчёт и коммерческое предложение");
  lines.push("5. Провести переговоры и закрыть сделку");

  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const tenantId = await getTenantId();
  const { searchParams } = req.nextUrl;
  const source      = searchParams.get("source")      ?? undefined;
  const temperature = searchParams.get("temperature")  ?? undefined;
  const pipeline    = searchParams.get("pipeline")     ?? undefined;
  const stats       = searchParams.get("stats") === "1";

  if (stats) {
    const data = await getMILeadStats(tenantId);
    return NextResponse.json(data);
  }

  const leads = await getMILeads(tenantId, { source, temperature, pipeline });
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const tenantId = await getTenantId();
  const body = await req.json().catch(() => ({}));
  const sources = body.sources ?? ["google", "telegram", "vk"];
  const limit   = Number(body.limit ?? 15);

  const result = await runLeadFinder(tenantId, sources, limit);
  return NextResponse.json({ ok: true, ...result });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { id, pipeline, lead } = body as { id: number; pipeline: MILeadPipeline; lead?: MILead };
  if (!id || !pipeline) return NextResponse.json({ ok: false }, { status: 400 });

  await updateMILeadPipeline(id, pipeline);

  // При переводе в "Контакт" — копируем в основную CRM
  let crmLeadId: string | null = null;
  if (pipeline === "CONTACT" && lead) {
    try {
      const now = new Date().toISOString();
      const newLead = await createLead({
        lead_id:             `mi-${lead.leadId}`,
        created_at:          now,
        updated_at:          now,
        name:                lead.company,
        company:             lead.company,
        phone:               lead.phone ?? "",
        email:               lead.email ?? "",
        telegram:            lead.telegram ?? "",
        product:             MI_LEAD_TYPE_LABELS[lead.type],
        product_link:        lead.website ?? "",
        category:            MI_LEAD_TYPE_LABELS[lead.type],
        quantity:            "",
        weight:              "",
        volume:              "",
        country_destination: "RU",
        city_destination:    lead.city ?? "",
        delivery_type:       "",
        service_type:        "",
        status:              "NEW",
        priority:            lead.temperature === "HOT" ? "HOT" : lead.temperature === "WARM" ? "WARM" : "COLD",
        estimated_value:     0,
        manager:             "",
        comment:             buildMIComment(lead),
        source:              `lead-finder:${lead.source}`,
        utm_source:          "market-intelligence",
        utm_campaign:        lead.source,
      });
      crmLeadId = newLead.lead_id;
    } catch { /* best-effort */ }
  }

  return NextResponse.json({ ok: true, crmLeadId });
}
