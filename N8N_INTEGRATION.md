# n8n Integration — ChinaBridge

Передача лидов из сайта в n8n для дальнейшей обработки (CRM, Telegram-уведомления, таблицы и т.д.).

---

## Endpoint

```
POST /api/leads
Content-Type: application/json
```

### Тело запроса

| Поле        | Тип    | Обязательное | Описание                          |
|-------------|--------|:---:|-----------------------------------|
| `name`      | string | ✓   | Имя клиента                       |
| `phone`     | string | ✓   | Телефон (минимум 10 цифр)         |
| `product`   | string | ✓   | Описание товара                   |
| `source`    | string | ✓   | `website_form` / `website_chat` / `api` |
| `telegram`  | string | —   | Telegram username                 |
| `link`      | string | —   | Ссылка на товар (1688, Alibaba…)  |
| `weight`    | string | —   | Вес груза (кг)                    |
| `volume`    | string | —   | Объём (м³)                        |
| `from_city` | string | —   | Город отправки в Китае            |
| `to_city`   | string | —   | Город получения                   |
| `service`   | string | —   | Нужная услуга                     |

### Успешный ответ — `201 Created`

```json
{
  "ok": true,
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Ошибки

| Код | `error`              | Причина                          |
|-----|----------------------|----------------------------------|
| 400 | `invalid_json`       | Тело не является валидным JSON   |
| 400 | `invalid_body`       | Тело не объект                   |
| 400 | `validation_failed`  | Не заполнены обязательные поля   |
| 502 | `webhook_failed`     | n8n не отвечает или вернул ошибку|

Пример ошибки валидации:
```json
{
  "ok": false,
  "error": "validation_failed",
  "details": {
    "phone": "phone must have at least 10 digits"
  }
}
```

---

## Переменные окружения

```env
# .env.local и Vercel → Settings → Environment Variables

N8N_WEBHOOK_URL=https://n8n.your-domain.com/webhook/chinabridge-lead
N8N_WEBHOOK_SECRET=your-secret-token   # опционально
```

`N8N_WEBHOOK_SECRET` передаётся в заголовке `x-webhook-secret`.
Проверяйте его в n8n через `Header Auth` или `IF`-ноду.

---

## Payload в n8n

Каждый запрос приходит в n8n в двух форматах в зависимости от источника:

### Из формы сайта (`/api/leads`)

```json
{
  "event": "lead.created",
  "lead": {
    "id": "uuid",
    "name": "Иван",
    "phone": "+7 777 000 00 00",
    "telegram": "@ivan",
    "product": "Велосипеды горные 26\"",
    "link": "https://1688.com/...",
    "weight": "200",
    "volume": "1.5",
    "from_city": "Гуанчжоу",
    "to_city": "Алматы",
    "service": "Сборные грузы",
    "source": "website_form",
    "created_at": "2026-07-30T12:00:00.000Z"
  }
}
```

### Из AI-чата (при завершении квалификации)

```json
{
  "event": "chat_lead.created",
  "session_id": "uuid",
  "lead": {
    "name": "Иван",
    "phone": "+7 777 000 00 00",
    "product": "Велосипеды",
    "destination": "Алматы",
    "source": "website_chat"
  }
}
```

---

## Настройка n8n

### 1. Создать Webhook-ноду

- Trigger: **Webhook**
- HTTP Method: `POST`
- Path: `chinabridge-lead` (или любой другой)
- Authentication: None (проверяйте секрет вручную через IF) или Header Auth

### 2. Пример пайплайна

```
Webhook → IF (event == lead.created) → Telegram Notify → Google Sheets
                                      → Telegram Notify (другой чат)
         ↓ (chat_lead.created)
         → Telegram Notify (отдельный канал)
```

### 3. Telegram-уведомление (шаблон)

В ноде **Telegram → Send Message** → Text:

```
🆕 Новая заявка с сайта

👤 {{ $json.lead.name }}
📞 {{ $json.lead.phone }}
{% if $json.lead.telegram %}✈️ {{ $json.lead.telegram }}{% endif %}

📦 Товар: {{ $json.lead.product }}
{% if $json.lead.weight %}⚖️ Вес: {{ $json.lead.weight }} кг{% endif %}
{% if $json.lead.to_city %}📍 Куда: {{ $json.lead.to_city }}{% endif %}
{% if $json.lead.service %}🛠️ Услуга: {{ $json.lead.service }}{% endif %}

🕐 {{ $json.lead.created_at }}
🔑 ID: {{ $json.lead.id }}
```

---

## Тест из консоли

```bash
curl -X POST https://chinabridge.pro/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Тест",
    "phone": "+7 777 000 00 00",
    "product": "Велосипеды",
    "to_city": "Алматы",
    "source": "api"
  }'
```

Ожидаемый ответ:
```json
{ "ok": true, "id": "..." }
```

---

## Таймаут и надёжность

- Запрос к n8n: таймаут **8 секунд**
- Если n8n не ответил → клиент получает `502 webhook_failed`
- Данные лида **не теряются** — клиент должен повторить запрос
- Chat-агент: webhook fire-and-forget (ошибка логируется, чат не прерывается)
