// LOGISTICS AI — обёртка над реальным Rate Engine (lib/rate-engine/rate-calculator.ts).
// ВАЖНО: calculateDeliveryCost считает ОДИН маршрут за вызов (по transport_type),
// а не сразу несколько вариантов — поэтому здесь дёргаем его несколько раз
// (truck/air/rail) и собираем варианты сами.
import { calculateDeliveryCost } from "@/lib/rate-engine/rate-calculator";
import type { TransportType } from "@/lib/rate-engine/types";

export const logisticsToolDefinition = {
  type: "function" as const,
  function: {
    name: "calculate_logistics_options",
    description:
      "Считает варианты доставки между городом в Китае и городом назначения в РФ/КЗ. " +
      "Известные города отправления: Guangzhou, Yiwu, Shenzhen, Beijing, Heihe. " +
      "Известные города назначения: Moscow (Russia), Almaty/Astana (Kazakhstan), " +
      "Blagoveshchensk (Russia, только из Heihe). Если пользователь назвал другой город — " +
      "используй ближайший из известных и предупреди об этом в ответе. " +
      "Возвращает несколько маршрутов (авто/жд/авиа) с ценой, сроком и типом транспорта.",
    parameters: {
      type: "object",
      properties: {
        city_from: { type: "string", description: "Город в Китае (по умолчанию Guangzhou)" },
        city_to: { type: "string", description: "Город назначения, например Moscow или Almaty" },
        country_to: { type: "string", enum: ["Russia", "Kazakhstan"] },
        weight_kg: { type: "number" },
        volume_m3: { type: "number" },
      },
      required: ["city_to", "country_to", "weight_kg"],
    },
  },
};

interface LogisticsInput {
  city_from?: string;
  city_to: string;
  country_to: "Russia" | "Kazakhstan";
  weight_kg: number;
  volume_m3?: number;
}

const CANDIDATE_TRANSPORT: TransportType[] = ["truck", "air", "rail"];

export async function runLogisticsCalculation(input: LogisticsInput) {
  const options: Array<{
    transport_type: TransportType;
    total_cost: number;
    currency: string;
    delivery_days_min?: number;
    delivery_days_max?: number;
  }> = [];

  for (const transport_type of CANDIDATE_TRANSPORT) {
    try {
      const result = await calculateDeliveryCost({
        country_from: "China",
        city_from: input.city_from || "Guangzhou",
        country_to: input.country_to,
        city_to: input.city_to,
        transport_type,
        weight: input.weight_kg,
        volume: input.volume_m3,
      });
      // Нет совпавшей ставки — total_cost=0 и нет matched_rate_id
      if (result.matched_rate_id === undefined && result.total_cost === 0) continue;
      options.push({
        transport_type,
        total_cost: result.total_cost,
        currency: result.currency,
        delivery_days_min: result.delivery_days_min,
        delivery_days_max: result.delivery_days_max,
      });
    } catch {
      // тариф для этого типа транспорта не настроен — пропускаем
    }
  }

  if (options.length === 0) {
    return {
      error: "Тариф для этого маршрута не найден в базе. Уточните у менеджера ChinaBridge.",
      city_from: input.city_from || "Guangzhou",
      city_to: input.city_to,
    };
  }

  return { city_from: input.city_from || "Guangzhou", city_to: input.city_to, options };
}
