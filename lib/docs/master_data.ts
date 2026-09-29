import { neon } from "@neondatabase/serverless";

const db = () => neon(process.env.DATABASE_URL!);

async function ensureTables(sql: ReturnType<typeof neon>) {
  await sql`
    CREATE TABLE IF NOT EXISTS docs_master_suppliers (
      id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_key    TEXT NOT NULL,
      name_cn     TEXT,
      name_en     TEXT,
      address     TEXT,
      total_docs  INTEGER DEFAULT 1,
      last_seen   TIMESTAMPTZ DEFAULT NOW(),
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_master_suppliers_key ON docs_master_suppliers(user_key)`;
  await sql`
    CREATE TABLE IF NOT EXISTS docs_master_products (
      id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_key        TEXT NOT NULL,
      supplier_id     UUID REFERENCES docs_master_suppliers(id),
      name_cn         TEXT NOT NULL,
      name_ru         TEXT,
      hs_code         TEXT,
      hs_confirmed    BOOLEAN DEFAULT FALSE,
      duty_rate       NUMERIC,
      unit            TEXT,
      times_seen      INTEGER DEFAULT 1,
      last_price_cny  NUMERIC,
      notes           TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_master_products_key ON docs_master_products(user_key)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_master_products_hs  ON docs_master_products(hs_code)`;
}

export async function upsertSupplier(
  userKey: string,
  data: { name_cn: string; name_en?: string; address?: string }
): Promise<string> {
  if (!process.env.DATABASE_URL || !userKey) return "";
  const sql = db();
  await ensureTables(sql).catch(() => null);

  const rows = await sql`
    SELECT id, total_docs FROM docs_master_suppliers
    WHERE user_key = ${userKey}
      AND (name_cn ILIKE ${"%" + (data.name_cn || "") + "%"}
           OR name_en ILIKE ${"%" + (data.name_en || "") + "%"})
    LIMIT 1
  `.catch(() => [] as unknown[]) as Array<{ id: string; total_docs: number }>;

  if (rows[0]) {
    await sql`
      UPDATE docs_master_suppliers
      SET total_docs = ${rows[0].total_docs + 1}, last_seen = NOW()
      WHERE id = ${rows[0].id}
    `.catch(() => null);
    return rows[0].id;
  }

  const ins = await sql`
    INSERT INTO docs_master_suppliers (user_key, name_cn, name_en, address)
    VALUES (${userKey}, ${data.name_cn || ""}, ${data.name_en || ""}, ${data.address || ""})
    RETURNING id
  `.catch(() => [] as unknown[]) as Array<{ id: string }>;
  return ins[0]?.id ?? "";
}

export async function upsertProduct(
  userKey: string,
  supplierId: string,
  data: {
    name_cn: string;
    name_ru?: string;
    hs_code?: string;
    unit?: string;
    price_cny?: number;
    duty_rate?: number;
  }
): Promise<{ id: string; was_known: boolean; confirmed_hs?: string }> {
  if (!process.env.DATABASE_URL || !userKey || !data.name_cn) return { id: "", was_known: false };
  const sql = db();

  const rows = await sql`
    SELECT id, hs_code, hs_confirmed, times_seen FROM docs_master_products
    WHERE user_key = ${userKey} AND name_cn = ${data.name_cn}
    LIMIT 1
  `.catch(() => [] as unknown[]) as Array<{ id: string; hs_code: string; hs_confirmed: boolean; times_seen: number }>;

  if (rows[0]) {
    await sql`
      UPDATE docs_master_products
      SET times_seen = ${rows[0].times_seen + 1},
          last_price_cny = ${data.price_cny ?? null},
          updated_at = NOW()
      WHERE id = ${rows[0].id}
    `.catch(() => null);
    return {
      id: rows[0].id,
      was_known: true,
      confirmed_hs: rows[0].hs_confirmed ? rows[0].hs_code : undefined,
    };
  }

  const ins = await sql`
    INSERT INTO docs_master_products
      (user_key, supplier_id, name_cn, name_ru, hs_code, unit, last_price_cny, duty_rate)
    VALUES
      (${userKey}, ${supplierId || null}, ${data.name_cn}, ${data.name_ru || ""}, ${data.hs_code || ""}, ${data.unit || ""}, ${data.price_cny ?? null}, ${data.duty_rate ?? null})
    RETURNING id
  `.catch(() => [] as unknown[]) as Array<{ id: string }>;
  return { id: ins[0]?.id ?? "", was_known: false };
}

export async function confirmHSCode(productId: string, code: string) {
  if (!process.env.DATABASE_URL) return;
  const sql = db();
  await sql`
    UPDATE docs_master_products
    SET hs_code = ${code}, hs_confirmed = TRUE, updated_at = NOW()
    WHERE id = ${productId}
  `.catch(() => null);
}

export async function getMasterDataHints(
  userKey: string,
  supplierNameCn: string
): Promise<{ supplier?: Record<string, unknown>; known_products: Array<Record<string, unknown>>; suggestion: string }> {
  if (!process.env.DATABASE_URL || !userKey || !supplierNameCn) return { known_products: [], suggestion: "" };
  const sql = db();
  await ensureTables(sql).catch(() => null);

  const suppliers = await sql`
    SELECT id, name_cn, name_en, total_docs FROM docs_master_suppliers
    WHERE user_key = ${userKey} AND name_cn ILIKE ${"%" + supplierNameCn + "%"}
    LIMIT 1
  `.catch(() => [] as unknown[]) as Array<Record<string, unknown>>;

  const supplier = suppliers[0];
  if (!supplier) return { known_products: [], suggestion: "Новый поставщик" };

  const products = await sql`
    SELECT id, name_cn, name_ru, hs_code, hs_confirmed, times_seen FROM docs_master_products
    WHERE user_key = ${userKey} AND supplier_id = ${supplier.id as string} AND hs_confirmed = TRUE
  `.catch(() => [] as unknown[]) as Array<Record<string, unknown>>;

  return {
    supplier,
    known_products: products,
    suggestion: products.length > 0
      ? `Известный поставщик. ${products.length} товаров с подтверждёнными кодами.`
      : `Поставщик встречался ${supplier.total_docs} раз.`,
  };
}

export async function getClientSuppliers(userKey: string) {
  if (!process.env.DATABASE_URL || !userKey) return [];
  const sql = db();
  await ensureTables(sql).catch(() => null);

  const suppliers = await sql`
    SELECT id, name_cn, name_en, address, total_docs, last_seen FROM docs_master_suppliers
    WHERE user_key = ${userKey}
    ORDER BY last_seen DESC
  `.catch(() => [] as unknown[]) as Array<Record<string, unknown>>;

  const result = await Promise.all(
    suppliers.map(async (s) => {
      const products = await sql`
        SELECT id, name_cn, name_ru, hs_code, hs_confirmed, times_seen
        FROM docs_master_products
        WHERE user_key = ${userKey} AND supplier_id = ${s.id as string}
        ORDER BY times_seen DESC
      `.catch(() => [] as unknown[]) as Array<Record<string, unknown>>;
      return { ...s, products };
    })
  );
  return result;
}
