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

    // Sort by updated_at DESC — newest row wins in insert-newest pattern
    rows.sort((a, b) =>
      String(b["updated_at"] ?? b["created_at"] ?? "").localeCompare(
        String(a["updated_at"] ?? a["created_at"] ?? "")
      )
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
      body: JSON.stringify({ data: [fields] }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[partner dtInsert] table=${tableId} status=${res.status} body=${body}`);
      return null;
    }
    return res.json().catch(() => null);
  } catch (e) {
    console.error(`[partner dtInsert] table=${tableId} error:`, e);
    return null;
  }
}

// ── Partners ─────────────────────────────────────────────────────────────────

export async function findPartnerByEmail(email: string): Promise<PartnerAccount | null> {
  // Sort by updated_at DESC — newest version of the record wins
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

export async function updatePartnerLanguage(currentRecord: PartnerAccount, language: Lang): Promise<boolean> {
  // n8n Data Tables REST v1 has no PATCH. Use insert-newest.
  const now = new Date().toISOString();
  const { id: _id, ...rest } = currentRecord; void _id;
  const result = await dtInsert(PARTNERS_TABLE, {
    partner_id:    rest.partner_id,
    email:         rest.email,
    password_hash: rest.password_hash,
    name_ru:       rest.name_ru,
    name_cn:       rest.name_cn ?? "",
    company:       rest.company ?? "",
    country:       rest.country ?? "",
    city:          rest.city ?? "",
    phone:         rest.phone ?? "",
    wechat:        rest.wechat ?? "",
    language,
    role:          rest.role,
    status:        rest.status,
    created_at:    rest.created_at,
    updated_at:    now,
  });
  return result !== null;
}

export async function updatePartnerProfile(
  currentRecord: PartnerAccount,
  fields: Partial<Pick<PartnerAccount, "name_ru" | "name_cn" | "company" | "city" | "phone" | "wechat">>
): Promise<boolean> {
  // n8n Data Tables REST v1 has no PATCH. Use insert-newest.
  const now = new Date().toISOString();
  const result = await dtInsert(PARTNERS_TABLE, {
    partner_id:    currentRecord.partner_id,
    email:         currentRecord.email,
    password_hash: currentRecord.password_hash,
    name_ru:       fields.name_ru       ?? currentRecord.name_ru,
    name_cn:       fields.name_cn       ?? currentRecord.name_cn ?? "",
    company:       fields.company       ?? currentRecord.company ?? "",
    country:       currentRecord.country ?? "",
    city:          fields.city          ?? currentRecord.city ?? "",
    phone:         fields.phone         ?? currentRecord.phone ?? "",
    wechat:        fields.wechat        ?? currentRecord.wechat ?? "",
    language:      currentRecord.language,
    role:          currentRecord.role,
    status:        currentRecord.status,
    created_at:    currentRecord.created_at,
    updated_at:    now,
  });
  return result !== null;
}

// ── Partner Tasks ─────────────────────────────────────────────────────────────

export async function getPartnerTasks(partnerId: string): Promise<PartnerTask[]> {
  const rows = await dtQuery(PARTNER_TASKS_TABLE, [
    { keyName: "partner_id", condition: "eq", keyValue: partnerId },
  ]) as PartnerTask[];

  // Deduplicate by task_id — keep newest version only (insert-newest pattern)
  const seen = new Set<string>();
  return rows.filter((t) => {
    if (seen.has(t.task_id)) return false;
    seen.add(t.task_id);
    return true;
  });
}

export async function getTaskById(taskId: string, partnerId: string): Promise<PartnerTask | null> {
  const rows = await dtQuery(PARTNER_TASKS_TABLE, [
    { keyName: "task_id", condition: "eq", keyValue: taskId },
    { keyName: "partner_id", condition: "eq", keyValue: partnerId },
  ]) as PartnerTask[];
  return rows[0] ?? null; // newest first after DESC sort
}

export async function updateTaskResponse(
  currentTask: PartnerTask,
  fields: Partial<Pick<
    PartnerTask,
    "status" | "response_product_name" | "response_price_usd" | "response_moq" |
    "response_factory" | "response_production_time" | "response_in_stock" |
    "response_comment" | "response_photos" | "response_factory_photos" | "response_video_url"
  >> & { completed_at?: string }
): Promise<boolean> {
  // n8n Data Tables REST v1 has no PATCH. Use insert-newest.
  const now = new Date().toISOString();
  const result = await dtInsert(PARTNER_TASKS_TABLE, {
    task_id:                  currentTask.task_id,
    partner_id:               currentTask.partner_id,
    type:                     currentTask.type,
    status:                   fields.status                  ?? currentTask.status,
    product_display:          currentTask.product_display,
    quantity:                 currentTask.quantity,
    quantity_unit:            currentTask.quantity_unit,
    deadline_hours:           currentTask.deadline_hours,
    description:              currentTask.description         ?? "",
    response_product_name:    fields.response_product_name   ?? currentTask.response_product_name   ?? "",
    response_price_usd:       fields.response_price_usd      ?? currentTask.response_price_usd      ?? "",
    response_moq:             fields.response_moq             ?? currentTask.response_moq             ?? "",
    response_factory:         fields.response_factory         ?? currentTask.response_factory         ?? "",
    response_production_time: fields.response_production_time ?? currentTask.response_production_time ?? "",
    response_in_stock:        fields.response_in_stock        ?? currentTask.response_in_stock        ?? "",
    response_comment:         fields.response_comment         ?? currentTask.response_comment         ?? "",
    response_photos:          fields.response_photos          ?? currentTask.response_photos          ?? "",
    response_factory_photos:  fields.response_factory_photos  ?? currentTask.response_factory_photos  ?? "",
    response_video_url:       fields.response_video_url       ?? currentTask.response_video_url       ?? "",
    completed_at:             fields.completed_at             ?? currentTask.completed_at             ?? "",
    created_at:               currentTask.created_at,
    updated_at:               now,
  });
  return result !== null;
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

export async function deletePartnerTask(taskId: string): Promise<boolean> {
  // n8n DELETE /rows/{id} returns 404 (endpoint not supported in REST v1).
  // Soft-delete is handled by status-store (Neon Postgres).
  // This function is kept for interface compatibility but always returns true.
  void taskId;
  return true;
}
