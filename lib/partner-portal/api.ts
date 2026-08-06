import type { PartnerAccount, PartnerTask, Lang } from "./types";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY  = process.env.N8N_API_KEY ?? "";

const PARTNERS_TABLE      = process.env.N8N_PARTNERS_TABLE_ID ?? "";
const PARTNER_TASKS_TABLE = process.env.N8N_PARTNER_TASKS_TABLE_ID ?? "";

type Filter = { keyName: string; condition: string; keyValue: string };

async function dtQuery(tableId: string, filters: Filter[] = []): Promise<unknown[]> {
  if (!tableId || !N8N_KEY) return [];
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${tableId}/rows`, {
      headers: { "X-N8N-API-KEY": N8N_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    let rows: Record<string, unknown>[] = Array.isArray(data)
      ? data
      : (data.rows ?? data.data ?? []);

    for (const f of filters) {
      rows = rows.filter((row) => {
        const val = String(row[f.keyName] ?? "");
        if (f.condition === "eq") return val === f.keyValue;
        if (f.condition === "contains") return val.includes(f.keyValue);
        return true;
      });
    }

    rows.sort((a, b) =>
      String(b["created_at"] ?? "").localeCompare(String(a["created_at"] ?? ""))
    );
    return rows;
  } catch {
    return [];
  }
}

async function dtInsert(tableId: string, fields: Record<string, unknown>): Promise<unknown | null> {
  if (!tableId || !N8N_KEY) return null;
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${tableId}/rows`, {
      method: "POST",
      headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return res.json().catch(() => null);
  } catch {
    return null;
  }
}

async function dtPatch(tableId: string, rowId: number, fields: Record<string, unknown>): Promise<boolean> {
  if (!tableId || !N8N_KEY) return false;
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${tableId}/rows/${rowId}`, {
      method: "PATCH",
      headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Partners ─────────────────────────────────────────────────────────────────

export async function findPartnerByEmail(email: string): Promise<PartnerAccount | null> {
  const rows = await dtQuery(PARTNERS_TABLE, [
    { keyName: "email", condition: "eq", keyValue: email.toLowerCase().trim() },
  ]) as PartnerAccount[];
  return rows[0] ?? null;
}

export async function getPartnerById(partnerId: string): Promise<PartnerAccount | null> {
  const rows = await dtQuery(PARTNERS_TABLE, [
    { keyName: "partner_id", condition: "eq", keyValue: partnerId },
  ]) as PartnerAccount[];
  return rows[0] ?? null;
}

export async function updatePartnerLanguage(rowId: number, language: Lang): Promise<boolean> {
  return dtPatch(PARTNERS_TABLE, rowId, { language, updated_at: new Date().toISOString() });
}

export async function updatePartnerProfile(
  rowId: number,
  fields: Partial<Pick<PartnerAccount, "name_ru" | "name_cn" | "company" | "city" | "phone" | "wechat">>
): Promise<boolean> {
  return dtPatch(PARTNERS_TABLE, rowId, { ...fields, updated_at: new Date().toISOString() });
}

// ── Partner Tasks ─────────────────────────────────────────────────────────────

export async function getPartnerTasks(partnerId: string): Promise<PartnerTask[]> {
  return dtQuery(PARTNER_TASKS_TABLE, [
    { keyName: "partner_id", condition: "eq", keyValue: partnerId },
  ]) as Promise<PartnerTask[]>;
}

export async function getTaskById(taskId: string, partnerId: string): Promise<PartnerTask | null> {
  const rows = await dtQuery(PARTNER_TASKS_TABLE, [
    { keyName: "task_id", condition: "eq", keyValue: taskId },
    { keyName: "partner_id", condition: "eq", keyValue: partnerId },
  ]) as PartnerTask[];
  return rows[0] ?? null;
}

export async function updateTaskResponse(
  rowId: number,
  fields: Partial<Pick<
    PartnerTask,
    "status" | "response_product_name" | "response_price_usd" | "response_moq" |
    "response_factory" | "response_production_time" | "response_in_stock" |
    "response_comment" | "response_photos" | "response_factory_photos" | "response_video_url"
  >> & { completed_at?: string }
): Promise<boolean> {
  return dtPatch(PARTNER_TASKS_TABLE, rowId, { ...fields, updated_at: new Date().toISOString() });
}

export async function createPartner(
  fields: Omit<PartnerAccount, "id" | "created_at" | "updated_at">
): Promise<PartnerAccount | null> {
  const now = new Date().toISOString();
  return dtInsert(PARTNERS_TABLE, { ...fields, created_at: now, updated_at: now }) as Promise<PartnerAccount | null>;
}

export async function createPartnerTask(fields: Omit<PartnerTask, "id" | "created_at" | "updated_at">): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await dtInsert(PARTNER_TASKS_TABLE, { ...fields, created_at: now, updated_at: now });
  return result !== null;
}

export async function deletePartnerTask(rowId: number): Promise<boolean> {
  if (!PARTNER_TASKS_TABLE || !N8N_KEY) return false;
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${PARTNER_TASKS_TABLE}/rows/${rowId}`, {
      method: "DELETE",
      headers: { "X-N8N-API-KEY": N8N_KEY },
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
