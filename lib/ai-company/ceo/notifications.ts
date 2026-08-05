import type { DepartmentReport } from "../types";
import type { CeoNotification } from "./types";

export function generateNotifications(depts: DepartmentReport[]): CeoNotification[] {
  const now = new Date().toISOString();
  const notifs: CeoNotification[] = [];

  notifs.push({
    id: "notif-system-init",
    level: "INFO",
    title: "🤖 CEO Command Center активирован",
    body: `Подключено ${depts.filter(d => d.status !== "IDLE").length} из ${depts.length} отделов. Все AI-агенты на связи.`,
    source: "Система",
    createdAt: now,
    read: false,
  });

  depts.forEach(dept => {
    const ts = dept.lastUpdated ?? now;
    if (dept.status === "CRITICAL") {
      notifs.push({
        id: `notif-critical-${dept.id}`,
        level: "CRITICAL",
        title: `🚨 ${dept.nameRu}: критическое состояние`,
        body: dept.problems[0] ?? "Требуется немедленное внимание CEO",
        source: dept.nameRu,
        createdAt: ts,
        read: false,
      });
    } else if (dept.status === "WARNING") {
      notifs.push({
        id: `notif-warn-${dept.id}`,
        level: "WARNING",
        title: `⚠️ ${dept.nameRu}: требует внимания`,
        body: dept.problems[0] ?? "Показатели ниже целевых",
        source: dept.nameRu,
        createdAt: ts,
        read: false,
      });
    } else if (dept.status === "GOOD") {
      notifs.push({
        id: `notif-info-${dept.id}`,
        level: "INFO",
        title: `✅ ${dept.nameRu}: всё в порядке`,
        body: dept.recommendations[0] ?? "Health GOOD",
        source: dept.nameRu,
        createdAt: ts,
        read: false,
      });
    }
  });

  return notifs;
}
