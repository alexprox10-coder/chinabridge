import type { ForecastData, ForecastPoint, ForecastScenario } from "./types";

function monthName(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" });
}

function buildTimeline(startMRR: number, growthRate: number, months = 4): ForecastPoint[] {
  const points: ForecastPoint[] = [];
  let mrr = startMRR;
  for (let i = 0; i < months; i++) {
    mrr = Math.round(mrr * (1 + growthRate / 100));
    points.push({
      month: monthName(i + 1),
      revenue: mrr,
      mrr,
      profit: Math.round(mrr * 0.27),
    });
  }
  return points;
}

export function generateForecast(currentMRR: number, currentGrowth: number): ForecastData {
  const base: ForecastScenario = {
    label: "Базовый",
    description: "Сохранение текущей динамики",
    growthRate: Math.max(5, currentGrowth),
    mrr3m: Math.round(currentMRR * Math.pow(1 + Math.max(5, currentGrowth) / 100, 3)),
    arr: Math.round(currentMRR * Math.pow(1 + Math.max(5, currentGrowth) / 100, 3) * 12),
    revenue3m: Math.round(currentMRR * 3 * (1 + Math.max(5, currentGrowth) / 100)),
    conditions: [
      "Текущий темп роста продаж",
      "Без изменений в маркетинге",
      "Удержание текущих клиентов",
    ],
  };

  const optimistic: ForecastScenario = {
    label: "Оптимистичный",
    description: "Запуск SaaS + масштабирование",
    growthRate: 30,
    mrr3m: Math.round(currentMRR * Math.pow(1.30, 3)),
    arr: Math.round(currentMRR * Math.pow(1.30, 3) * 12),
    revenue3m: Math.round(currentMRR * 3 * 1.30),
    conditions: [
      "Запуск SaaS подписки для импортёров",
      "Подключение 15+ новых карго-клиентов",
      "Масштабирование Shorts / SEO",
      "Выход на рынок Казахстана",
    ],
  };

  const pessimistic: ForecastScenario = {
    label: "Консервативный",
    description: "Замедление без новых каналов",
    growthRate: 5,
    mrr3m: Math.round(currentMRR * Math.pow(1.05, 3)),
    arr: Math.round(currentMRR * Math.pow(1.05, 3) * 12),
    revenue3m: Math.round(currentMRR * 3 * 1.05),
    conditions: [
      "Без новых каналов привлечения",
      "Сезонное снижение в Q3",
      "Рост конкуренции на рынке",
    ],
  };

  const timeline = buildTimeline(currentMRR, Math.max(5, currentGrowth));

  return {
    currentMRR,
    base,
    optimistic,
    pessimistic,
    timeline,
    keyDriver: "Запуск SaaS-подписки и Kazakhstan SEO — ключевые драйверы роста x2",
  };
}
