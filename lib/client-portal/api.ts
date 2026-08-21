import type {
  ClientAccount, ClientOrder, OrderTracking,
  ClientDocument, ClientMessage,
} from "./types";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY  = process.env.N8N_API_KEY ?? "";

const CLIENTS_TABLE       = process.env.N8N_CLIENTS_TABLE_ID ?? "";
const ORDERS_TABLE        = process.env.N8N_ORDERS_TABLE_ID ?? "";
const TRACKING_TABLE      = process.env.N8N_TRACKING_TABLE_ID ?? "";
const DOCUMENTS_TABLE     = process.env.N8N_DOCUMENTS_TABLE_ID ?? "";
const MESSAGES_TABLE      = process.env.N8N_MESSAGES_TABLE_ID ?? "";
const CALCULATIONS_TABLE  = process.env.N8N_CALCULATIONS_TABLE_ID ?? "";

export interface PortalCalculation {
  id?: number;
  calc_id: string;
  client_id: string;
  city_from: string;
  city_to: string;
  product_name: string;
  product_category: string;
  weight: number;
  volume: number;
  transport_type: string;
  total_cost: number;
  currency: string;
  delivery_days_min?: number;
  delivery_days_max?: number;
  status: string;
  created_at: string;
}

type Filter = { keyName: string; condition: string; keyValue: string };

async function dtQuery(tableId: string, filters: Filter[] = [], order = "created_at"): Promise<unknown[]> {
  if (!tableId || !N8N_KEY) return [];
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${tableId}/rows`, {
      method: "GET",
      headers: { "X-N8N-API-KEY": N8N_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    let rows: Record<string, unknown>[] = Array.isArray(data)
      ? data
      : (data.rows ?? data.data ?? []);

    // Client-side filtering
    for (const f of filters) {
      rows = rows.filter((row) => {
        const val = String(row[f.keyName] ?? "");
        if (f.condition === "eq") return val === f.keyValue;
        if (f.condition === "contains") return val.includes(f.keyValue);
        return true;
      });
    }

    // Sort descending by `order` field
    rows.sort((a, b) =>
      String(b[order] ?? "").localeCompare(String(a[order] ?? ""))
    );

    return rows;
  } catch {
    return [];
  }
}

async function dtInsert(tableId: string, fields: Record<string, unknown>): Promise<unknown | null> {
  if (!tableId || !N8N_KEY) {
    console.error(`[dtInsert] Missing config: tableId=${!!tableId} key=${!!N8N_KEY}`);
    return null;
  }
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
      console.error(`[dtInsert] table=${tableId} status=${res.status} body=${body}`);
      return null;
    }
    return res.json().catch(() => null);
  } catch (e) {
    console.error(`[dtInsert] table=${tableId} error:`, e);
    return null;
  }
}

async function dtPatch(tableId: string, rowId: number, fields: Record<string, unknown>): Promise<boolean> {
  if (!tableId || !N8N_KEY) return false;
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${tableId}/rows/${rowId}`, {
      method: "PATCH",
      headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ data: fields }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Clients ─────────────────────────────────────────────────────────────────

export async function getAllClients(): Promise<ClientAccount[]> {
  const rows = await dtQuery(CLIENTS_TABLE, [], "created_at") as ClientAccount[];
  // Deduplicate by email: explicitly keep the row with the newest created_at
  const map = new Map<string, ClientAccount>();
  for (const r of rows) {
    const key = r.email?.toLowerCase() ?? r.client_id;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, r);
    } else {
      const tNew = new Date(r.created_at ?? 0).getTime();
      const tOld = new Date(existing.created_at ?? 0).getTime();
      if (tNew > tOld) map.set(key, r);
    }
  }
  return Array.from(map.values()).filter(c => c.status !== "DELETED");
}

export async function softDeleteClient(clientId: string, currentRecord: ClientAccount): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await dtInsert(CLIENTS_TABLE, {
    client_id:     clientId,
    email:         currentRecord.email,
    name:          currentRecord.name,
    password_hash: currentRecord.password_hash ?? "",
    company:       currentRecord.company ?? "",
    phone:         currentRecord.phone ?? "",
    telegram:      currentRecord.telegram ?? "",
    inn:           currentRecord.inn ?? "",
    country:       currentRecord.country ?? "",
    role:          currentRecord.role ?? "CLIENT",
    status:        "DELETED",
    created_at:    now,
    updated_at:    now,
  });
  return result !== null;
}

export async function findClientByEmail(email: string): Promise<ClientAccount | null> {
  // Sort by updated_at so the most-recent version wins (update-by-insert pattern)
  const rows = await dtQuery(CLIENTS_TABLE, [
    { keyName: "email", condition: "eq", keyValue: email.toLowerCase().trim() },
  ], "updated_at") as ClientAccount[];
  return rows[0] ?? null;
}

export async function getClientById(clientId: string): Promise<ClientAccount | null> {
  const rows = await dtQuery(CLIENTS_TABLE, [
    { keyName: "client_id", condition: "eq", keyValue: clientId },
  ], "updated_at") as ClientAccount[];
  return rows[0] ?? null;
}

export async function updateClientProfile(
  currentRecord: ClientAccount,
  fields: Partial<Pick<ClientAccount, "name" | "company" | "phone" | "password_hash" | "telegram" | "inn" | "country">>
): Promise<boolean> {
  // n8n Data Tables REST API v1 does not support row-level PATCH.
  // Use insert-newest: write a full clean record with only schema fields.
  // findClientByEmail / getClientById sort by updated_at DESC → newest row wins.
  const now = new Date().toISOString();
  const result = await dtInsert(CLIENTS_TABLE, {
    client_id:     currentRecord.client_id,
    email:         currentRecord.email,
    password_hash: fields.password_hash ?? currentRecord.password_hash,
    name:          fields.name ?? currentRecord.name,
    company:       fields.company ?? currentRecord.company ?? "",
    phone:         fields.phone ?? currentRecord.phone ?? "",
    telegram:      fields.telegram ?? currentRecord.telegram ?? "",
    inn:           fields.inn ?? currentRecord.inn ?? "",
    country:       fields.country ?? currentRecord.country ?? "",
    role:          currentRecord.role,
    status:        currentRecord.status,
    created_at:    currentRecord.created_at,
    updated_at:    now,
  });
  return result !== null;
}

export async function createClient(
  fields: Omit<ClientAccount, "id" | "created_at" | "updated_at">
): Promise<ClientAccount | null> {
  const now = new Date().toISOString();
  return dtInsert(CLIENTS_TABLE, { ...fields, created_at: now, updated_at: now }) as Promise<ClientAccount | null>;
}

// ── Orders ───────────────────────────────────────────────────────────────────

export async function getClientOrders(clientId: string): Promise<ClientOrder[]> {
  return dtQuery(ORDERS_TABLE, [
    { keyName: "client_id", condition: "eq", keyValue: clientId },
  ]) as Promise<ClientOrder[]>;
}

export async function getAllOrders(): Promise<ClientOrder[]> {
  return dtQuery(ORDERS_TABLE) as Promise<ClientOrder[]>;
}

export async function getOrderById(orderId: string): Promise<ClientOrder | null> {
  const rows = await dtQuery(ORDERS_TABLE, [
    { keyName: "order_id", condition: "eq", keyValue: orderId },
  ]) as ClientOrder[];
  return rows[0] ?? null;
}

// ── Tracking ─────────────────────────────────────────────────────────────────

export async function getOrderTracking(orderId: string): Promise<OrderTracking[]> {
  const rows = await dtQuery(TRACKING_TABLE, [
    { keyName: "order_id", condition: "eq", keyValue: orderId },
  ], "timestamp") as OrderTracking[];
  return rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ── Documents ────────────────────────────────────────────────────────────────

export async function getClientDocuments(clientId: string): Promise<ClientDocument[]> {
  return dtQuery(DOCUMENTS_TABLE, [
    { keyName: "client_id", condition: "eq", keyValue: clientId },
  ]) as Promise<ClientDocument[]>;
}

export async function getOrderDocuments(orderId: string): Promise<ClientDocument[]> {
  return dtQuery(DOCUMENTS_TABLE, [
    { keyName: "order_id", condition: "eq", keyValue: orderId },
  ]) as Promise<ClientDocument[]>;
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function getClientMessages(clientId: string, orderId?: string): Promise<ClientMessage[]> {
  const filters: Filter[] = [{ keyName: "client_id", condition: "eq", keyValue: clientId }];
  if (orderId) filters.push({ keyName: "order_id", condition: "eq", keyValue: orderId });
  const rows = await dtQuery(MESSAGES_TABLE, filters, "created_at") as ClientMessage[];
  return rows.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function sendMessage(
  msg: Omit<ClientMessage, "id" | "created_at">
): Promise<boolean> {
  const result = await dtInsert(MESSAGES_TABLE, {
    ...msg,
    created_at: new Date().toISOString(),
  });
  return result !== null;
}

export async function getAllMessages(clientId?: string): Promise<ClientMessage[]> {
  const filters: Filter[] = clientId
    ? [{ keyName: "client_id", condition: "eq", keyValue: clientId }]
    : [];
  const rows = await dtQuery(MESSAGES_TABLE, filters, "created_at") as ClientMessage[];
  return rows.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function markManagerMessagesRead(clientId: string): Promise<void> {
  const rows = await dtQuery(MESSAGES_TABLE, [
    { keyName: "client_id", condition: "eq", keyValue: clientId },
    { keyName: "author_role", condition: "eq", keyValue: "MANAGER" },
  ]) as ClientMessage[];
  const unread = rows.filter((m) => !m.is_read);
  await Promise.allSettled(unread.map((m) => dtPatch(MESSAGES_TABLE, m.id, { is_read: true })));
}

export async function countUnreadMessages(clientId: string): Promise<number> {
  const rows = await dtQuery(MESSAGES_TABLE, [
    { keyName: "client_id", condition: "eq", keyValue: clientId },
    { keyName: "author_role", condition: "eq", keyValue: "MANAGER" },
  ]) as ClientMessage[];
  return rows.filter((m) => !m.is_read).length;
}

// ── Calculations ─────────────────────────────────────────────────────────────

export async function saveClientCalculation(
  fields: Omit<PortalCalculation, "id" | "created_at">
): Promise<PortalCalculation | null> {
  return dtInsert(CALCULATIONS_TABLE, {
    ...fields,
    created_at: new Date().toISOString(),
  }) as Promise<PortalCalculation | null>;
}

export async function getClientCalculations(clientId: string): Promise<PortalCalculation[]> {
  return dtQuery(CALCULATIONS_TABLE, [
    { keyName: "client_id", condition: "eq", keyValue: clientId },
  ]) as Promise<PortalCalculation[]>;
}

export async function getAllCalculations(): Promise<PortalCalculation[]> {
  return dtQuery(CALCULATIONS_TABLE) as Promise<PortalCalculation[]>;
}
