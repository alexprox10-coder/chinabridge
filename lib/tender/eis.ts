// ЕИС (zakupki.gov.ru) client — завершённые электронные аукционы 44-ФЗ
// API docs: https://zakupki.gov.ru/epz/order/extendedsearch/api/
// Open Data: https://zakupki.gov.ru/api/1/

import type { RawTender, LawType } from "./types";
import { CONFIG } from "./types";

const EIS_BASE = "https://zakupki.gov.ru";

// ЕИС public API endpoint for completed purchase procedures
// statusStage=E → published/completed (результаты опубликованы)
// fz44=on → 44-ФЗ electronic auctions
const SEARCH_PARAMS = {
  fz44: "on",
  fz223: "on",
  statusStage: "E",
  sortBy: "PUBLISH_DATE",
  sortDirection: "false",
  showLotsInfoHidden: "false",
};

interface EISSearchItem {
  id?: string;
  purchaseNumber?: string;
  purchaseName?: string;
  purchaseTypeName?: string;
  organisationName?: string;
  organisationInn?: string;
  region?: string;
  maxPrice?: number | string;
  winnerPrice?: number | string;
  publishDate?: string;
  endDate?: string;
  deliveryDeadline?: string | number;
  lot?: {
    subject?: string;
    quantity?: number;
    unitName?: string;
    okpd2?: Array<{ code?: string }>;
  };
  winner?: {
    name?: string;
    inn?: string;
    price?: number | string;
  };
  href?: string;
  contractDate?: string;
}

function parseNum(v: unknown): number {
  if (v == null) return 0;
  return parseFloat(String(v).replace(/\s/g, "").replace(",", ".")) || 0;
}

function mapItem(item: EISSearchItem, source: string): RawTender | null {
  const purchaseNumber = item.purchaseNumber ?? item.id ?? "";
  if (!purchaseNumber) return null;

  const winner = item.winner;
  const winnerName = winner?.name ?? "";
  const winnerInn  = winner?.inn  ?? "";
  const winnerPrice = parseNum(winner?.price ?? item.winnerPrice);
  if (!winnerName || !winnerInn) return null;

  const initialPrice = parseNum(item.maxPrice);
  const finalPrice   = winnerPrice || initialPrice;

  if (finalPrice < CONFIG.MIN_CONTRACT_VALUE) return null;

  const subject = item.lot?.subject ?? item.purchaseName ?? "";
  const okpd2Codes = (item.lot?.okpd2 ?? []).map(o => o.code ?? "").filter(Boolean);

  const deliveryDeadline = (() => {
    const v = item.deliveryDeadline;
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = parseInt(v);
      return isNaN(n) ? null : n;
    }
    return null;
  })();

  const law: LawType = source.includes("223") ? "223fz" : "44fz";

  return {
    tender_id:        `eis-${purchaseNumber}`,
    source,
    purchase_number:  purchaseNumber,
    purchase_type:    item.purchaseTypeName ?? "Электронный аукцион",
    law_type:         law,
    customer:         item.organisationName ?? "",
    customer_inn:     item.organisationInn ?? null,
    customer_region:  item.region ?? null,
    subject,
    category:         okpd2Codes[0] ? `ОКПД2 ${okpd2Codes[0]}` : null,
    description:      null,
    quantity:         item.lot?.quantity ?? null,
    unit:             item.lot?.unitName ?? null,
    initial_price:    initialPrice,
    final_price:      finalPrice,
    currency:         "RUB",
    publication_date: item.publishDate ?? new Date().toISOString(),
    end_date:         item.endDate ?? null,
    contract_date:    item.contractDate ?? null,
    delivery_deadline: deliveryDeadline,
    delivery_region:  item.region ?? null,
    winner:           winnerName,
    winner_inn:       winnerInn,
    winner_price:     finalPrice,
    winner_rank:      1,
    source_url:       item.href
      ? `${EIS_BASE}${item.href}`
      : `${EIS_BASE}/epz/order/notice/printForm/view.html?regNumber=${purchaseNumber}`,
  };
}

export async function fetchRecentWinners(options: {
  dateFrom: string;  // YYYY-MM-DD
  dateTo: string;
  page?: number;
  pageSize?: number;
}): Promise<RawTender[]> {
  const { dateFrom, dateTo, page = 1, pageSize = 50 } = options;

  // ЕИС supports both JSON and HTML responses. We request JSON.
  const params = new URLSearchParams({
    ...SEARCH_PARAMS,
    updateDateFrom: dateFrom,
    updateDateTo:   dateTo,
    pageNumber:     String(page),
    recordsPerPage: `_${pageSize}`,
  });

  const url = `${EIS_BASE}/epz/order/extendedsearch/results.html?${params}`;

  const resp = await fetch(url, {
    headers: {
      Accept: "application/json, text/json",
      "Accept-Language": "ru-RU,ru;q=0.9",
      "User-Agent": "ChinaBridge-TenderIntelligence/1.0 (contact: admin@chinabridge.pro)",
    },
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);

  if (!resp?.ok) return [];

  // Try JSON parse first; EIS may return HTML — handle both
  const text = await resp.text();
  let items: EISSearchItem[] = [];

  try {
    const json = JSON.parse(text);
    // EIS JSON response structure variations
    items = json.data ?? json.results ?? json.orders ?? json.items ?? [];
    if (!Array.isArray(items)) items = [];
  } catch {
    // EIS returned HTML — extract data via regex fallback
    // This is a degraded mode; structured API preferred
    items = extractFromHtml(text);
  }

  return items
    .map(item => mapItem(item, "eis_44fz"))
    .filter((t): t is RawTender => t !== null);
}

// Fallback: extract minimal data from ЕИС HTML search results
function extractFromHtml(html: string): EISSearchItem[] {
  const items: EISSearchItem[] = [];
  // Match purchase card blocks — ЕИС lists purchase numbers in <span class="search-registry-entry-block__bage">
  const numPattern = /purchaseNumber[^\d]*(\d{11,23})/g;
  const namePattern = /<span class="cardMainInfo__title"[^>]*>([^<]+)<\/span>/g;

  const numbers: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = numPattern.exec(html)) !== null) numbers.push(m[1]);

  const names: string[] = [];
  while ((m = namePattern.exec(html)) !== null) names.push(m[1].trim());

  for (let i = 0; i < numbers.length; i++) {
    items.push({ purchaseNumber: numbers[i], purchaseName: names[i] });
  }
  return items;
}

// Pre-filter: check if tender subject likely relates to Chinese goods
// Called BEFORE expensive AI to reduce API costs (ТЗ §40-41)
export function preFilterTender(t: RawTender): boolean {
  if (t.final_price < CONFIG.MIN_CONTRACT_VALUE) return false;

  // Filter out obvious services
  const lc = (t.subject + (t.category ?? "")).toLowerCase();
  const serviceKeywords = [
    "услуги", "ремонт зданий", "монтаж трубопровод", "строительство объект",
    "охрана", "уборка", "клининг", "питание", "обучение", "страхование",
    "медицинские услуги", "юридические", "бухгалтер", "аудит",
    "образовательные", "научно-исследовательские", "культурные мероприятия",
  ];
  if (serviceKeywords.some(kw => lc.includes(kw))) return false;

  return true;
}
