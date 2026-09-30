// PROFILE MEMORY — читает/обновляет память о клиенте.
// Neon напрямую (raw SQL), как везде в проекте — без Supabase-клиента.
import { neon } from "@neondatabase/serverless";

const db = () => neon(process.env.DATABASE_URL!);

export const profileToolDefinition = {
  type: "function" as const,
  function: {
    name: "get_or_update_client_profile",
    description:
      "Читает или обновляет профиль клиента: обычные маршруты, целевая маржа, " +
      "размер партии, известные поставщики. Вызови с action=get в начале диалога " +
      "чтобы не спрашивать то что уже известно. Вызови action=update после того как " +
      "узнал новые предпочтения клиента (маршрут, целевая маржа, категория товаров).",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["get", "update"] },
        user_telegram: { type: "string" },
        typical_route_from: { type: "string" },
        typical_route_to: { type: "string" },
        typical_destination_country: { type: "string", enum: ["RU", "KZ"] },
        target_margin_percent: { type: "number" },
        max_delivery_days: { type: "number" },
        typical_batch_size: { type: "string" },
        preferred_marketplace: { type: "string" },
      },
      required: ["action", "user_telegram"],
    },
  },
};

interface ProfileInput {
  action: "get" | "update";
  user_telegram: string;
  [key: string]: unknown;
}

export async function runProfileAction(input: ProfileInput) {
  const sql = db();

  if (input.action === "get") {
    const rows = (await sql`
      SELECT * FROM ai_client_profiles WHERE user_telegram = ${input.user_telegram}
    `) as Array<Record<string, unknown>>;
    return rows[0] ?? { is_new_client: true };
  }

  const fields: Record<string, unknown> = {};
  for (const key of [
    "typical_route_from",
    "typical_route_to",
    "typical_destination_country",
    "target_margin_percent",
    "max_delivery_days",
    "typical_batch_size",
    "preferred_marketplace",
  ]) {
    if (input[key] !== undefined) fields[key] = input[key];
  }

  const rows = (await sql`
    INSERT INTO ai_client_profiles (user_telegram, typical_route_from, typical_route_to, typical_destination_country, target_margin_percent, max_delivery_days, typical_batch_size, preferred_marketplace, updated_at)
    VALUES (${input.user_telegram}, ${fields.typical_route_from ?? null}, ${fields.typical_route_to ?? null}, ${fields.typical_destination_country ?? null}, ${fields.target_margin_percent ?? null}, ${fields.max_delivery_days ?? null}, ${fields.typical_batch_size ?? null}, ${fields.preferred_marketplace ?? null}, NOW())
    ON CONFLICT (user_telegram) DO UPDATE SET
      typical_route_from = COALESCE(EXCLUDED.typical_route_from, ai_client_profiles.typical_route_from),
      typical_route_to = COALESCE(EXCLUDED.typical_route_to, ai_client_profiles.typical_route_to),
      typical_destination_country = COALESCE(EXCLUDED.typical_destination_country, ai_client_profiles.typical_destination_country),
      target_margin_percent = COALESCE(EXCLUDED.target_margin_percent, ai_client_profiles.target_margin_percent),
      max_delivery_days = COALESCE(EXCLUDED.max_delivery_days, ai_client_profiles.max_delivery_days),
      typical_batch_size = COALESCE(EXCLUDED.typical_batch_size, ai_client_profiles.typical_batch_size),
      preferred_marketplace = COALESCE(EXCLUDED.preferred_marketplace, ai_client_profiles.preferred_marketplace),
      updated_at = NOW()
    RETURNING *
  `) as Array<Record<string, unknown>>;

  return rows[0];
}
