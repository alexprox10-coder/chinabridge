import type { CheckResult, CheckSection, CtoReport } from "./types";
import { scoreSection, calcHealthScore } from "./scoring";
import { checkApi }          from "./checks/api";
import { checkDatabase }     from "./checks/database";
import { checkPerformance }  from "./checks/performance";
import { checkSeo }          from "./checks/seo";
import { checkSecurity }     from "./checks/security";
import { checkAiProviders }  from "./checks/ai-providers";
import { checkCrm }          from "./checks/crm";
import { checkPayments }     from "./checks/payments";
import { checkTelegramBot }  from "./checks/telegram";
import { sendCtoReport }     from "./reporter";
import { saveCtoReport }     from "./db";

interface SectionDef {
  id:   string;
  name: string;
  icon: string;
  fn:   () => Promise<CheckResult[]>;
}

const SECTIONS: SectionDef[] = [
  { id: "api",          name: "API маршруты",     icon: "🔌", fn: checkApi },
  { id: "database",     name: "База данных",      icon: "🗄",  fn: checkDatabase },
  { id: "performance",  name: "Производительность",icon: "⚡",  fn: checkPerformance },
  { id: "seo",          name: "SEO",              icon: "🔍", fn: checkSeo },
  { id: "security",     name: "Безопасность",     icon: "🔒", fn: checkSecurity },
  { id: "ai_providers", name: "AI модели",        icon: "🤖", fn: checkAiProviders },
  { id: "crm",          name: "CRM",              icon: "📋", fn: checkCrm },
  { id: "payments",     name: "Платежи",          icon: "💳", fn: checkPayments },
  { id: "telegram",     name: "Telegram",         icon: "💬", fn: checkTelegramBot },
];

function buildSection(def: SectionDef, checks: CheckResult[]): CheckSection {
  const { score, status } = scoreSection(checks);
  return { id: def.id, name: def.name, icon: def.icon, checks, score, status };
}

function collectIssues(sections: CheckSection[]) {
  const all = sections.flatMap(s => s.checks);
  return {
    critical: all.filter(c => c.status === "ERROR"),
    warning:  all.filter(c => c.status === "WARNING"),
    minor:    [] as CheckResult[],
  };
}

function buildRecommendations(sections: CheckSection[]): string[] {
  const recs: string[] = [];
  for (const s of sections) {
    const errors   = s.checks.filter(c => c.status === "ERROR");
    const warnings = s.checks.filter(c => c.status === "WARNING");

    if (errors.length > 0) {
      recs.push(`[${s.name}] Исправить ${errors.length} критических ошибок: ${errors.map(e => e.name).join(", ")}`);
    }
    if (warnings.length > 2) {
      recs.push(`[${s.name}] Проверить ${warnings.length} предупреждений`);
    }
    if (s.id === "performance") {
      const slow = s.checks.filter(c => c.ms && c.ms > 2000);
      if (slow.length) recs.push(`Оптимизировать медленные страницы: ${slow.map(c => c.name).join(", ")}`);
    }
  }
  if (recs.length === 0) recs.push("Платформа работает штатно. Продолжать мониторинг.");
  return recs.slice(0, 8);
}

export async function runCtoAudit(): Promise<CtoReport> {
  const t0 = Date.now();

  // Run all checks in parallel
  const results = await Promise.allSettled(
    SECTIONS.map(s => s.fn().catch(e => [{ name: s.name, status: "ERROR" as const, message: String(e) }]))
  );

  const sections: CheckSection[] = results.map((r, i) => {
    const checks = r.status === "fulfilled" ? r.value :
      [{ name: SECTIONS[i].name, status: "ERROR" as const, message: String(r.reason) }];
    return buildSection(SECTIONS[i], checks);
  });

  const healthScore  = calcHealthScore(sections);
  const systemStatus = healthScore >= 85 ? "GREEN" : healthScore >= 60 ? "YELLOW" : "RED";
  const issues       = collectIssues(sections);
  const recommendations = buildRecommendations(sections);

  const report: CtoReport = {
    runAt:        new Date().toISOString(),
    durationMs:   Date.now() - t0,
    healthScore,
    systemStatus,
    sections,
    issues,
    recommendations,
    autoFixed:    [],
    telegramSent: false,
    ceoNotified:  false,
  };

  // Save to DB
  try {
    report.id = await saveCtoReport(report);
  } catch {
    // Non-fatal — continue
  }

  // Send Telegram report
  try {
    report.telegramSent = await sendCtoReport(report);
  } catch {
    // Non-fatal
  }

  return report;
}
