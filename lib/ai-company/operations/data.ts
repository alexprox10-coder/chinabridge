import type {
  Deal, Partner, CargoItem, DocumentRecord, ClientRecord,
  OperationsKPIs, OperationsDirectorReport,
} from "./types";
import { detectRisks, calculateHealth } from "./risk";

// ── Smart mock (реалистичные данные импортной компании) ────────────────────

const DEALS: Deal[] = [
  {
    id: "D-1241", clientName: "ООО Технологии+", supplierName: "Shenzhen ElecCo",
    product: "Электронные компоненты", status: "SHIPPING", weight: 850,
    route: "Шэньчжэнь → Москва", eta: 12, value: 480000,
    startDate: "2026-07-14", riskLevel: "LOW",
  },
  {
    id: "D-1242", clientName: "ИП Сидоров А.В.", supplierName: "Guangzhou TextilePro",
    product: "Текстильное оборудование", status: "PURCHASE", weight: 320,
    route: "Гуанчжоу → Екатеринбург", eta: 21, value: 290000,
    startDate: "2026-07-20", riskLevel: "HIGH",
    notes: "Поставщик задержал подтверждение заказа на 5 дней",
  },
  {
    id: "D-1243", clientName: "ООО Альфа Трейд", supplierName: "Yiwu Goods Ltd",
    product: "Товары для дома (микс)", status: "CUSTOMS", weight: 1200,
    route: "Иу → Москва", eta: 5, value: 620000,
    startDate: "2026-07-08", riskLevel: "HIGH",
    notes: "Таможня запросила сертификаты соответствия",
  },
  {
    id: "D-1244", clientName: "ЗАО МетроПласт", supplierName: "Ningbo PlasticWorks",
    product: "Полимерные изделия", status: "CHINA_WAREHOUSE",
    weight: 550, route: "Нинбо → Новосибирск", eta: 18, value: 155000,
    startDate: "2026-07-25", riskLevel: "LOW",
  },
  {
    id: "D-1245", clientName: "ООО ТехЛогист", supplierName: "Shenzhen ElecCo",
    product: "LED-модули", status: "DELIVERED", weight: 210,
    route: "Шэньчжэнь → СПб", eta: 0, value: 87000,
    startDate: "2026-07-01", riskLevel: "LOW",
  },
  {
    id: "D-1246", clientName: "ИП Волкова М.С.", supplierName: "Hangzhou FashionMFG",
    product: "Одежда (сезонная коллекция)", status: "NEW", weight: 180,
    route: "Ханчжоу → Москва", eta: 25, value: 210000,
    startDate: "2026-07-30", riskLevel: "LOW",
  },
  {
    id: "D-1247", clientName: "ООО Альфа Трейд", supplierName: "Dongguan ToolMaker",
    product: "Ручной инструмент", status: "SHIPPING", weight: 740,
    route: "Дунгуань → Москва", eta: 8, value: 340000,
    startDate: "2026-07-18", riskLevel: "MEDIUM",
  },
  {
    id: "D-1248", clientName: "ООО Технологии+", supplierName: "Foshan FurnitureCo",
    product: "Офисная мебель", status: "DELIVERED", weight: 1800,
    route: "Фошань → Москва", eta: 0, value: 920000,
    startDate: "2026-06-25", riskLevel: "LOW",
  },
];

const PARTNERS: Partner[] = [
  {
    id: "P-01", name: "Shenzhen ElecCo", city: "Шэньчжэнь",
    status: "ACTIVE", ordersCount: 14, avgDeliveryDays: 9,
    rating: 95, lastContactDays: 2, responseTime: "< 4 часов",
    aiAnalysis: "Надёжный партнёр — всегда соблюдает сроки. За год 0 критических инцидентов.",
    recommendation: "Приоритетный поставщик для электроники. Рассмотреть эксклюзивное соглашение.",
  },
  {
    id: "P-02", name: "Guangzhou TextilePro", city: "Гуанчжоу",
    status: "AT_RISK", ordersCount: 6, avgDeliveryDays: 14,
    rating: 72, lastContactDays: 8, responseTime: "2-3 дня",
    aiAnalysis: "Поставщик задерживает ответы и подтверждения заказов. D-1242 просрочен на 5 дней.",
    recommendation: "Эскалировать по сделке D-1242. Искать альтернативного текстильного поставщика в Цзянсу.",
  },
  {
    id: "P-03", name: "Yiwu Goods Ltd", city: "Иу",
    status: "ACTIVE", ordersCount: 22, avgDeliveryDays: 11,
    rating: 88, lastContactDays: 1, responseTime: "< 6 часов",
    aiAnalysis: "Хороший объём заказов, стабильное качество. Текущая проблема — документы на таможне, не по вине поставщика.",
    recommendation: "Запросить заблаговременно сертификаты для всех будущих поставок.",
  },
  {
    id: "P-04", name: "Ningbo PlasticWorks", city: "Нинбо",
    status: "ACTIVE", ordersCount: 4, avgDeliveryDays: 16,
    rating: 81, lastContactDays: 4, responseTime: "< 12 часов",
    aiAnalysis: "Новый партнёр, пока 4 заказа. Качество хорошее, сроки в норме.",
    recommendation: "Тестировать дальше. После 10 заказов предложить рамочный договор.",
  },
];

const CARGOS: CargoItem[] = [
  {
    id: "C-881", dealId: "D-1241", clientName: "ООО Технологии+",
    product: "Электроника", weight: 850, route: "Шэньчжэнь → Москва",
    status: "SHIPPING", eta: 12, value: 480000, carrier: "FESCO", riskLevel: "LOW",
  },
  {
    id: "C-882", dealId: "D-1243", clientName: "ООО Альфа Трейд",
    product: "Товары для дома", weight: 1200, route: "Иу → Москва",
    status: "CUSTOMS", eta: 5, value: 620000, carrier: "РЖД Логистика", riskLevel: "HIGH",
  },
  {
    id: "C-883", dealId: "D-1244", clientName: "ЗАО МетроПласт",
    product: "Полимеры", weight: 550, route: "Нинбо → Новосибирск",
    status: "CHINA_WAREHOUSE", eta: 18, value: 155000, carrier: "CEVA Logistics", riskLevel: "LOW",
  },
  {
    id: "C-884", dealId: "D-1247", clientName: "ООО Альфа Трейд",
    product: "Инструмент", weight: 740, route: "Дунгуань → Москва",
    status: "SHIPPING", eta: 8, value: 340000, carrier: "Fesco Line", riskLevel: "MEDIUM",
  },
];

const DOCUMENTS: DocumentRecord[] = [
  { id: "DOC-1", type: "INVOICE", dealId: "D-1243", clientName: "ООО Альфа Трейд", product: "Товары для дома", status: "READY", riskLevel: "LOW", action: "" },
  { id: "DOC-2", type: "PACKING_LIST", dealId: "D-1243", clientName: "ООО Альфа Трейд", product: "Товары для дома", status: "MISSING", riskLevel: "HIGH", action: "Запросить у поставщика Yiwu Goods Ltd срочно" },
  { id: "DOC-3", type: "CERTIFICATE", dealId: "D-1243", clientName: "ООО Альфа Трейд", product: "Товары для дома", status: "PENDING", riskLevel: "HIGH", action: "Получить в сертификационном центре — 2-3 дня" },
  { id: "DOC-4", type: "CONTRACT", dealId: "D-1242", clientName: "ИП Сидоров А.В.", product: "Текстильное оборудование", status: "READY", riskLevel: "LOW", action: "" },
  { id: "DOC-5", type: "INVOICE", dealId: "D-1242", clientName: "ИП Сидоров А.В.", product: "Текстильное оборудование", status: "MISSING", riskLevel: "HIGH", action: "Запросить у Guangzhou TextilePro после подтверждения заказа" },
  { id: "DOC-6", type: "CUSTOMS_DECL", dealId: "D-1241", clientName: "ООО Технологии+", product: "Электроника", status: "READY", riskLevel: "LOW", action: "" },
  { id: "DOC-7", type: "INVOICE", dealId: "D-1247", clientName: "ООО Альфа Трейд", product: "Инструмент", status: "READY", riskLevel: "LOW", action: "" },
  { id: "DOC-8", type: "CERTIFICATE", dealId: "D-1244", clientName: "ЗАО МетроПласт", product: "Полимеры", status: "PENDING", riskLevel: "MEDIUM", action: "Поставщик готовит сертификат — срок 5 дней" },
];

const CLIENTS: ClientRecord[] = [
  {
    id: "CL-01", name: "ООО Альфа Трейд", status: "ACTIVE",
    lastContactDays: 3, satisfaction: 88, repeatOrders: 5, activeDeals: 2,
    recommendation: "Предложить программу лояльности — крупный клиент, 2 сделки одновременно.",
    riskLevel: "LOW",
  },
  {
    id: "CL-02", name: "ООО Технологии+", status: "AT_RISK",
    lastContactDays: 14, satisfaction: 74, repeatOrders: 3, activeDeals: 2,
    recommendation: "Срочно связаться — нет контакта 14 дней. Отправить статус по D-1241 и D-1248.",
    riskLevel: "HIGH",
  },
  {
    id: "CL-03", name: "ИП Сидоров А.В.", status: "ACTIVE",
    lastContactDays: 5, satisfaction: 80, repeatOrders: 2, activeDeals: 1,
    recommendation: "Предупредить о задержке поставщика D-1242. Связаться сегодня.",
    riskLevel: "MEDIUM",
  },
  {
    id: "CL-04", name: "ЗАО МетроПласт", status: "ACTIVE",
    lastContactDays: 7, satisfaction: 91, repeatOrders: 4, activeDeals: 1,
    recommendation: "Клиент доволен. Предложить следующий заказ с увеличенным объёмом.",
    riskLevel: "LOW",
  },
];

// ── KPIs ───────────────────────────────────────────────────────────────────

function buildKPIs(deals: Deal[], cargos: CargoItem[]): OperationsKPIs {
  return {
    activeDeals:    deals.filter(d => d.status !== "DELIVERED").length,
    activeCargo:    cargos.filter(c => c.status !== "DELIVERED").length,
    inPurchase:     deals.filter(d => d.status === "PURCHASE").length,
    inLogistics:    deals.filter(d => d.status === "SHIPPING").length,
    inCustoms:      deals.filter(d => d.status === "CUSTOMS").length,
    delivered:      deals.filter(d => d.status === "DELIVERED").length,
    problems:       deals.filter(d => d.riskLevel === "HIGH").length,
    avgDeliveryDays: 13,
  };
}

// ── Export ─────────────────────────────────────────────────────────────────

export interface OperationsData {
  deals: Deal[];
  partners: Partner[];
  cargos: CargoItem[];
  documents: DocumentRecord[];
  clients: ClientRecord[];
  kpis: OperationsKPIs;
  health: ReturnType<typeof calculateHealth>;
  risks: ReturnType<typeof detectRisks>;
}

export async function fetchOperationsData(): Promise<OperationsData> {
  const risks  = detectRisks(DEALS, CARGOS, DOCUMENTS, CLIENTS);
  const health = calculateHealth(DEALS, CARGOS, DOCUMENTS, CLIENTS, risks);
  const kpis   = buildKPIs(DEALS, CARGOS);

  return {
    deals: DEALS,
    partners: PARTNERS,
    cargos: CARGOS,
    documents: DOCUMENTS,
    clients: CLIENTS,
    kpis,
    health,
    risks,
  };
}

export type { OperationsDirectorReport };
