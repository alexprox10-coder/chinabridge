import type { Deal, CargoItem, DocumentRecord, ClientRecord, RiskAlert, OperationsHealth } from "./types";

export function detectRisks(
  deals: Deal[],
  cargos: CargoItem[],
  documents: DocumentRecord[],
  clients: ClientRecord[],
): RiskAlert[] {
  const alerts: RiskAlert[] = [];

  // Задержка поставщика
  const delayedDeals = deals.filter(d => d.status === "PURCHASE" && d.riskLevel === "HIGH");
  for (const d of delayedDeals) {
    alerts.push({
      id: `risk_supplier_${d.id}`,
      type: "SUPPLIER_DELAY",
      title: "Задержка поставщика",
      description: `Поставщик ${d.supplierName} не подтвердил отгрузку по сделке #${d.id} (${d.product}). Ожидалось ${d.eta} дней назад.`,
      dealId: d.id,
      probability: 65,
      solution: `Связаться с ${d.supplierName} и запросить подтверждение. При отсутствии ответа — альтернативный поставщик.`,
      priority: "HIGH",
    });
  }

  // Таможенная задержка
  const customsCargo = cargos.filter(c => c.status === "CUSTOMS" && c.riskLevel === "HIGH");
  for (const c of customsCargo) {
    alerts.push({
      id: `risk_customs_${c.id}`,
      type: "CUSTOMS_HOLD",
      title: "Таможня: запрос документов",
      description: `Груз #${c.id} (${c.product}, ${c.weight} кг) задержан на таможне. Требуется доп. документация.`,
      dealId: c.dealId,
      probability: 70,
      solution: "Подготовить сертификат соответствия и техническое описание. Передать брокеру в течение 24 часов.",
      priority: "HIGH",
    });
  }

  // Отсутствие документов
  const missingDocs = documents.filter(d => d.status === "MISSING" && d.riskLevel === "HIGH");
  for (const d of missingDocs) {
    const docLabels: Record<string, string> = {
      INVOICE: "Инвойс", PACKING_LIST: "Упаковочный лист", CONTRACT: "Договор",
      CERTIFICATE: "Сертификат", CUSTOMS_DECL: "Таможенная декларация",
    };
    alerts.push({
      id: `risk_docs_${d.id}`,
      type: "MISSING_DOCS",
      title: `Отсутствует: ${docLabels[d.type] ?? d.type}`,
      description: `Сделка #${d.dealId} клиента «${d.clientName}» (${d.product}): документ отсутствует. Риск задержки отгрузки.`,
      dealId: d.dealId,
      probability: 80,
      solution: `Запросить у ${d.clientName} или поставщика. Срок: 48 часов.`,
      priority: "HIGH",
    });
  }

  // Клиент без контакта
  const atRiskClients = clients.filter(c => c.lastContactDays >= 10 && c.status !== "CHURNED");
  for (const c of atRiskClients) {
    alerts.push({
      id: `risk_client_${c.id}`,
      type: "CLIENT_UNHAPPY",
      title: `Нет контакта с ${c.name}`,
      description: `Клиент «${c.name}» не получал обновлений ${c.lastContactDays} дней. ${c.activeDeals} активных сделок требуют отчётности.`,
      probability: 40,
      solution: `Связаться с ${c.name} сегодня. Отправить статус-апдейт по всем ${c.activeDeals} сделкам.`,
      priority: c.lastContactDays >= 14 ? "HIGH" : "MEDIUM",
    });
  }

  // Рост стоимости доставки (константный сигнал)
  if (cargos.some(c => c.status === "SHIPPING" && c.riskLevel === "MEDIUM")) {
    alerts.push({
      id: "risk_shipping_cost",
      type: "SHIPPING_COST",
      title: "Рост ставок морской доставки",
      description: "Ставки на маршруте Китай→Россия выросли на 18% по сравнению с прошлым месяцем. Бюджет ряда сделок под угрозой.",
      probability: 55,
      solution: "Пересчитать стоимость для новых сделок. Рассмотреть ж/д маршрут через Казахстан (-12% к стоимости).",
      priority: "MEDIUM",
    });
  }

  const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  return alerts.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
}

export function calculateHealth(
  deals: Deal[],
  cargos: CargoItem[],
  documents: DocumentRecord[],
  clients: ClientRecord[],
  risks: RiskAlert[],
): OperationsHealth {
  let score = 50;

  const highRisks = risks.filter(r => r.priority === "HIGH").length;
  const medRisks  = risks.filter(r => r.priority === "MEDIUM").length;

  score -= highRisks * 12;
  score -= medRisks * 5;

  if (deals.filter(d => d.status === "DELIVERED").length >= 3) score += 15;
  if (cargos.filter(c => c.riskLevel === "LOW").length >= cargos.length * 0.7) score += 15;
  if (documents.filter(d => d.status === "READY").length >= documents.length * 0.8) score += 10;
  if (clients.filter(c => c.status === "ACTIVE").length >= clients.length * 0.8) score += 10;
  if (deals.filter(d => ["SHIPPING", "CUSTOMS"].includes(d.status)).length > 0) score += 10;

  score = Math.max(0, Math.min(100, score));
  const status = score >= 80 ? "GOOD" : score >= 55 ? "WARNING" : "CRITICAL";

  const positives: string[] = [];
  const risks2: string[] = [];

  if (deals.filter(d => d.status === "DELIVERED").length > 0)
    positives.push(`${deals.filter(d => d.status === "DELIVERED").length} сделок успешно завершено`);
  if (cargos.filter(c => c.status === "SHIPPING").length > 0)
    positives.push(`${cargos.filter(c => c.status === "SHIPPING").length} грузов в пути — по графику`);
  if (clients.filter(c => c.status === "ACTIVE").length > 0)
    positives.push(`${clients.filter(c => c.status === "ACTIVE").length} клиентов активны`);

  if (highRisks > 0) risks2.push(`${highRisks} критических риска требуют немедленного решения`);
  if (documents.filter(d => d.status === "MISSING").length > 0)
    risks2.push(`${documents.filter(d => d.status === "MISSING").length} документа отсутствуют`);
  if (clients.filter(c => c.lastContactDays >= 14).length > 0)
    risks2.push(`${clients.filter(c => c.lastContactDays >= 14).length} клиент(а) без контакта >14 дней`);

  return { score, status, positives, risks: risks2 };
}
