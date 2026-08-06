import type { CtoReport } from "./types";
import { sendTelegramMessage } from "./checks/telegram";

function statusEmoji(score: number): string {
  if (score >= 90) return "🟢";
  if (score >= 70) return "🟡";
  return "🔴";
}

function sectionLine(icon: string, name: string, score: number): string {
  const e = score >= 90 ? "✅" : score >= 60 ? "⚠️" : "❌";
  return `${e} ${icon} ${name}: ${score}/100`;
}

export async function buildTelegramReport(report: CtoReport): Promise<string> {
  const date    = new Date(report.runAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time    = new Date(report.runAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });
  const durSec  = (report.durationMs / 1000).toFixed(1);
  const emoji   = statusEmoji(report.healthScore);

  const sectionLines = report.sections
    .map(s => sectionLine(s.icon, s.name, s.score))
    .join("\n");

  const criticalList = report.issues.critical.length
    ? report.issues.critical.map(i => `  🔴 ${i.name}: ${i.message}`).join("\n")
    : "  Нет";

  const warningList = report.issues.warning.length
    ? report.issues.warning.map(i => `  ⚠️ ${i.name}: ${i.message}`).join("\n")
    : "  Нет";

  const recList = report.recommendations.length
    ? report.recommendations.map((r, i) => `  ${i + 1}. ${r}`).join("\n")
    : "  Нет";

  const lines = [
    `🤖 <b>AI CTO Daily Report</b>`,
    `📅 ${date} ${time} МСК`,
    ``,
    `🏗 <b>Проект:</b> ChinaBridge Platform`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `<b>HEALTH SCORE: ${emoji} ${report.healthScore}/100</b>`,
    ``,
    `<b>Проверки по модулям:</b>`,
    sectionLines,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `<b>Критические ошибки (${report.issues.critical.length}):</b>`,
    criticalList,
    ``,
    `<b>Предупреждения (${report.issues.warning.length}):</b>`,
    warningList,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `<b>Рекомендации:</b>`,
    recList,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `⏱ Время аудита: ${durSec}с`,
    `🔗 <a href="https://chinabridge.pro/admin/ai-company/cto">Открыть дашборд</a>`,
  ];

  return lines.join("\n");
}

export async function sendCtoReport(report: CtoReport): Promise<boolean> {
  const text = await buildTelegramReport(report);
  return sendTelegramMessage(text);
}
