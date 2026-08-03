# Rate Engine Core v1.0

Внутренний модуль расчёта стоимости доставки. Работает автономно — не изменяет существующий сайт, CRM, AI-консультант или Smart Proposal Engine. Может быть подключён к ним опционально.

---

## Архитектура

```
lib/rate-engine/
  types.ts             — интерфейсы и типы
  db.ts                — CRUD для n8n DataTables
  validators.ts        — валидация входных данных
  route-matcher.ts     — поиск маршрута и тарифа
  rate-calculator.ts   — calculateDeliveryCost()
  pricing-rules.ts     — управление правилами наценки
  margin-calculator.ts — расчёт маржи/наценки

app/api/
  rates/               — GET/POST тарифов, PUT/DELETE по ID
  rates/calculate/     — POST расчёт стоимости
  rate-routes/         — CRUD маршрутов
  rate-services/       — CRUD дополнительных услуг
  rate-rules/          — CRUD правил наценки

app/admin/
  rates/               — UI управления тарифами
  routes/              — UI маршрутов
  services/            — UI дополнительных услуг
  pricing/             — UI правил наценки + калькулятор маржи
```

---

## n8n DataTables

| Таблица             | ID                 | Назначение                   |
|---------------------|--------------------|------------------------------|
| shipping_rates      | asS7Xa9QFnPpAzN5   | Ставки перевозчиков          |
| routes              | Fw1nup7EcasZniSo   | Маршруты (откуда → куда)     |
| additional_services | xpmKXW51U37OJ8lb   | Инспекция, страхование и др. |
| pricing_rules       | 8TMB7H9pwS55ccfu   | Правила наценки/скидок       |
| rate_calculations   | DZAaoggjCa8sRhGP   | История расчётов             |

---

## API

### POST /api/rates/calculate

```json
{
  "country_to": "Russia",
  "city_to": "Moscow",
  "country_from": "China",
  "city_from": "Yiwu",
  "transport_type": "rail",
  "weight": 500,
  "volume": 2.5,
  "packages": 10,
  "service_ids": [1, 3],
  "currency": "USD",
  "lead_id": "optional-crm-id"
}
```

Ответ:
```json
{
  "ok": true,
  "data": {
    "transport_cost": 650.00,
    "additional_cost": 50.00,
    "total_cost": 700.00,
    "currency": "USD",
    "delivery_days_min": 18,
    "delivery_days_max": 25,
    "matched_rate_id": 3,
    "breakdown": {
      "base_cost": 600.00,
      "services": [
        { "name": "Инспекция", "cost": 30 },
        { "name": "Страхование", "cost": 20 }
      ]
    }
  }
}
```

### GET /api/rates
Возвращает список тарифов: `{ data: ShippingRate[] }`

### POST /api/rates
Создаёт тариф. Body: `Partial<ShippingRate>`

### PUT /api/rates/:id
Обновляет тариф по ID.

### DELETE /api/rates/:id
Удаляет тариф.

Аналогичные CRUD-маршруты: `/api/rate-routes`, `/api/rate-services`, `/api/rate-rules`.

---

## Логика расчёта

### Типы тарифов

| RateType | Формула                        |
|----------|-------------------------------|
| KG       | weight × price_value           |
| CBM      | volume × price_value           |
| BOX      | packages × price_value         |
| FIXED    | price_value (фиксированная)    |

### Сопоставление маршрута

1. Точное совпадение: `city_from` + `city_to` + `transport_type`
2. Откат: совпадение по стране

### Сопоставление тарифа

Скоринг по параметрам (transport_type, cargo_type, диапазон веса/объёма). Выбирается тариф с наибольшим score.

### Правила наценки

| RuleType | Логика                              |
|----------|-------------------------------------|
| margin   | cost × (1 + value/100)              |
| markup   | cost × (1 + value/100)              |
| discount | cost × (1 − value/100)              |

Применяются все активные правила последовательно.

---

## Расчёт маржи

```typescript
import { calculateMargin } from '@/lib/rate-engine/margin-calculator';

const result = calculateMargin(sale_price, cost_price);
// result.profit = sale_price - cost_price
// result.margin_percent = profit / sale_price × 100
```

```typescript
import { calcSalePriceFromMargin } from '@/lib/rate-engine/margin-calculator';

// Цена при целевой марже 30%
const sale = calcSalePriceFromMargin(1000, 30); // 1428.57
```

---

## Admin Panel

| URL              | Страница                              |
|------------------|---------------------------------------|
| /admin/rates     | Таблица тарифов, фильтры, CRUD-форма  |
| /admin/routes    | Маршруты (откуда → куда)              |
| /admin/services  | Карточки доп. услуг с быстрым добавл. |
| /admin/pricing   | Правила + встроенный калькулятор маржи|

---

## Интеграция

### С Delivery Calculator

В `app/api/calculator/submit/route.ts` после сохранения лида вызвать:

```typescript
const rateResult = await fetch('/api/rates/calculate', {
  method: 'POST',
  body: JSON.stringify({
    country_to: data.destinationCity,
    city_to: data.destinationCity,
    weight: data.weight,
    volume: data.volume,
    lead_id: leadId,
  }),
}).then(r => r.json());
```

### Со Smart Proposal Engine

В `app/api/proposals/create/route.ts` можно включить `recommended_delivery_cost` и `delivery_days` из ответа Rate Engine в PDF.

---

## Seed данные (пример)

```bash
# Тариф: авто из Иу в Москву, за кг
POST /api/rates
{
  "carrier_name": "China Auto Express",
  "transport_type": "truck",
  "cargo_type": "general",
  "rate_type": "KG",
  "price_value": 1.8,
  "currency": "USD",
  "min_weight": 100,
  "max_weight": 5000,
  "delivery_days_min": 20,
  "delivery_days_max": 30,
  "status": "active"
}

# Маршрут
POST /api/rate-routes
{
  "country_from": "China",
  "city_from": "Иу",
  "country_to": "Russia",
  "city_to": "Москва",
  "transport_type": "truck",
  "delivery_days_min": 20,
  "delivery_days_max": 30,
  "status": "active"
}

# Наценка 20%
POST /api/rate-rules
{
  "name": "Стандартная наценка",
  "rule_type": "markup",
  "value": 20,
  "status": "active"
}
```
