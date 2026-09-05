const N8N_BASE = process.env.N8N_BASE_URL ?? 'https://n8n.arendadom24.ru';
const N8N_KEY = process.env.N8N_API_KEY ?? '';

export const TABLE_IDS = {
  shipping_rates: 'asS7Xa9QFnPpAzN5',
  routes: 'Fw1nup7EcasZniSo',
  additional_services: 'xpmKXW51U37OJ8lb',
  pricing_rules: '8TMB7H9pwS55ccfu',
  rate_calculations: 'DZAaoggjCa8sRhGP',
  rate_benchmarks: 'TL16JNMLmZPVLPkI',
} as const;

async function n8nFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${N8N_BASE}${path}`, {
    ...init,
    headers: {
      'X-N8N-API-KEY': N8N_KEY,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`n8n ${path} → ${res.status}: ${text}`);
  }
  // DELETE returns no body
  if (res.status === 204 || res.headers.get('content-length') === '0') return null;
  return res.json();
}

function normalize<T>(raw: unknown): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as T[];
  if (Array.isArray(obj.rows)) return obj.rows as T[];
  return [];
}

export async function listRows<T>(tableId: string): Promise<T[]> {
  const data = await n8nFetch(`/api/v1/data-tables/${tableId}/rows?limit=250`);
  return normalize<T>(data);
}

export async function getRow<T>(tableId: string, rowId: number): Promise<T | null> {
  try {
    const data = await n8nFetch(`/api/v1/data-tables/${tableId}/rows/${rowId}`);
    return data as T;
  } catch {
    return null;
  }
}

export async function createRow<T>(tableId: string, fields: Record<string, unknown>): Promise<T> {
  const data = await n8nFetch(`/api/v1/data-tables/${tableId}/rows`, {
    method: 'POST',
    body: JSON.stringify({ data: [fields] }),
  });
  // n8n returns array when posting; extract first item
  if (Array.isArray(data) && data.length > 0) return data[0] as T;
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj?.data) && obj.data.length > 0) return (obj.data as T[])[0];
  return data as T;
}

export async function updateRow<T>(tableId: string, rowId: number, fields: Record<string, unknown>): Promise<T> {
  const data = await n8nFetch(`/api/v1/data-tables/${tableId}/rows/update`, {
    method: 'PATCH',
    body: JSON.stringify({
      filter: { filters: [{ columnName: 'id', condition: 'eq', value: rowId }] },
      data: fields,
    }),
  });
  return data as T;
}

export async function deleteRow(tableId: string, rowId: number): Promise<void> {
  await n8nFetch(`/api/v1/data-tables/${tableId}/rows/delete`, {
    method: 'DELETE',
    body: JSON.stringify({
      filter: { filters: [{ columnName: 'id', condition: 'eq', value: rowId }] },
    }),
  });
}
