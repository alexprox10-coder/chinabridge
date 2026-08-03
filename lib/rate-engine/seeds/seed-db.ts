// Lazy env reading — reads process.env inside each function call,
// not at module load time (unlike db.ts). Required for seed scripts
// that load .env.local before making API calls.

const TABLE_IDS = {
  shipping_rates: 'asS7Xa9QFnPpAzN5',
  routes: 'Fw1nup7EcasZniSo',
  additional_services: 'xpmKXW51U37OJ8lb',
} as const;

export type SeedTableKey = keyof typeof TABLE_IDS;

function n8nBase() {
  return process.env.N8N_BASE_URL ?? 'https://n8n.arendadom24.ru';
}
function n8nKey() {
  return process.env.N8N_API_KEY ?? '';
}

async function n8nFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${n8nBase()}${path}`, {
    ...init,
    headers: {
      'X-N8N-API-KEY': n8nKey(),
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`n8n ${path} → ${res.status}: ${text}`);
  }
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

export async function seedListRows<T>(table: SeedTableKey): Promise<T[]> {
  const id = TABLE_IDS[table];
  const data = await n8nFetch(`/api/v1/data-tables/${id}/rows?limit=250`);
  return normalize<T>(data);
}

export async function seedCreateRow<T>(table: SeedTableKey, fields: Record<string, unknown>): Promise<T> {
  const id = TABLE_IDS[table];
  const data = await n8nFetch(`/api/v1/data-tables/${id}/rows`, {
    method: 'POST',
    body: JSON.stringify({ data: [fields] }),
  });
  // n8n returns array when posting; extract first item
  if (Array.isArray(data) && data.length > 0) return data[0] as T;
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj?.data) && obj.data.length > 0) return (obj.data as T[])[0];
  return data as T;
}
