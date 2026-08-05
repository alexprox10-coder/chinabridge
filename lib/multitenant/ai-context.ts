import type { Tenant, TenantSettings, TenantAiContext } from "./types";
import { getTenantSettings } from "./store";

export function buildAiContext(tenant: Tenant): TenantAiContext {
  const settings = getTenantSettings(tenant.id);
  return {
    tenantId: tenant.id,
    companyName: tenant.companyName,
    industry: tenant.industry,
    country: tenant.country,
    language: tenant.language,
    currency: tenant.currency,
    plan: tenant.plan,
    goals: settings.companyGoals,
    markets: settings.targetMarkets,
    description: tenant.description,
  };
}

export function buildAiSystemPrompt(tenant: Tenant): string {
  const ctx = buildAiContext(tenant);
  return `Ты AI-директор компании «${ctx.companyName}».
Отрасль: ${ctx.industry}. Страна: ${ctx.country}. Валюта: ${ctx.currency}.
Описание: ${ctx.description}
Цели компании: ${ctx.goals.join("; ")}.
Целевые рынки: ${ctx.markets.join(", ")}.
Тарифный план: ${ctx.plan}.
Язык ответов: ${ctx.language === "ru" ? "русский" : "английский"}.
Отвечай строго в контексте этой компании. Не смешивай данные с другими организациями.`;
}

export function injectTenantContext(basePrompt: string, tenant: Tenant): string {
  const ctx = buildAiContext(tenant);
  const header = `[Контекст компании: ${ctx.companyName} | ${ctx.country} | ${ctx.plan}]\n\n`;
  return header + basePrompt;
}

export function buildDeptAiPrompt(
  deptName: string,
  deptData: string,
  tenant: Tenant
): string {
  const ctx = buildAiContext(tenant);
  return `Ты AI-директор отдела "${deptName}" компании «${ctx.companyName}».
${ctx.description}
Страна: ${ctx.country}, Валюта: ${ctx.currency}, Рынки: ${ctx.markets.join(", ")}.
Цели: ${ctx.goals.slice(0, 2).join("; ")}.

Данные отдела:
${deptData}

Дай краткий аналитический отчёт и 2–3 конкретные рекомендации для ${ctx.companyName}.`;
}
