# AI Sales Agent — ChinaBridge

Многоагентная система для квалификации лидов и консультаций в чате на сайте.

---

## Архитектура

```
Browser
  └── components/chat/ChatWidget.tsx   (lazy, SSR off)
        └── ChatWindow.tsx             (UI, состояние)
              └── POST /api/chat
                    └── lib/ai/orchestrator.ts
                          ├── lib/ai/memory.ts            (in-memory store)
                          ├── lib/ai/agents/index.ts      (реестр агентов)
                          │     ├── consultant.ts
                          │     ├── qualification.ts
                          │     ├── logistic.ts
                          │     ├── sales.ts
                          │     └── operator.ts
                          ├── lib/ai/client.ts            (OpenRouter API)
                          ├── lib/knowledge/index.ts      (база знаний)
                          └── lib/webhook/n8n.ts          (fire-and-forget)
```

---

## Роли агентов

| Агент            | Имя     | Задача                                        | Передаёт в               |
|------------------|---------|-----------------------------------------------|--------------------------|
| `consultant`     | Алексей | Встреча, общие вопросы, маршрутизация         | qualification/logistic/sales/operator |
| `qualification`  | Мария   | Сбор данных для заявки (7 полей)              | logistic/sales/operator  |
| `logistic`       | Дмитрий | Сроки, маршруты, таможня                      | qualification/sales/operator |
| `sales`          | Андрей  | Цены, условия, выбор услуги                   | qualification/logistic/operator |
| `operator`       | —       | Эскалация, передача живому менеджеру          | —                        |

---

## Поток данных

1. Клиент открывает чат → создаётся `sessionId` (UUID в браузере)
2. Каждое сообщение → `POST /api/chat` с `{ sessionId, message }`
3. Оркестратор берёт `ConversationState` из памяти или создаёт новый
4. Запускает текущего агента → LLM возвращает JSON с `message` + опциональными действиями
5. Если агент сигнализирует `handoff` → переключается на новый агент
6. Если агент сигнализирует `leadComplete` → лид уходит в n8n webhook (fire-and-forget)
7. API возвращает `{ message, agent, agentLabel, sessionId }`

---

## Данные лида (LeadData)

```typescript
interface LeadData {
  name?:        string;   // имя
  phone?:       string;   // телефон
  telegram?:    string;   // telegram username
  product?:     string;   // товар
  quantity?:    string;   // количество
  weight?:      string;   // вес в кг
  destination?: string;   // страна + город доставки
  service?:     string;   // нужная услуга
  timeline?:    string;   // желаемые сроки
  comment?:     string;   // дополнительно
  source:       "website_chat";
}
```

---

## Переменные окружения

```env
# OpenRouter
OPENROUTER_API_KEY=sk-or-...        # ключ с openrouter.ai
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openai/gpt-4o-mini # или anthropic/claude-3.5-haiku

# n8n (опционально)
N8N_WEBHOOK_URL=https://n8n.your-domain.com/webhook/chinabridge-lead
N8N_WEBHOOK_SECRET=your-secret
```

Добавить в Vercel: **Settings → Environment Variables** (target: Production + Preview).

---

## Смена модели

В `OPENROUTER_MODEL` можно указать любую OpenRouter-совместимую модель:

| Модель                          | Особенности                     |
|---------------------------------|---------------------------------|
| `openai/gpt-4o-mini`            | Быстро, дёшево (по умолчанию)   |
| `openai/gpt-4o`                 | Умнее, дороже                   |
| `anthropic/claude-3.5-haiku`    | Быстрый Claude                  |
| `anthropic/claude-3.5-sonnet`   | Лучшее качество                 |
| `google/gemini-flash-1.5`       | Дёшево, быстро                  |

---

## Миграция на Supabase

Типы БД уже готовы в `lib/ai/types.ts`:

```typescript
interface DBConversation { ... }
interface DBMessage      { ... }
```

Замените `lib/ai/memory.ts` на Supabase-клиент с теми же сигнатурами функций:
- `getOrCreate(sessionId)` → `upsert` в `conversations`
- `addMessage(state, role, content)` → `insert` в `messages`
- `updateLead(state, patch)` → `update` в `conversations`

---

## Запуск локально

1. Вставьте `OPENROUTER_API_KEY` в `.env.local`
2. `npm run dev`
3. Откройте сайт → в правом нижнем углу появится кнопка чата

---

## n8n Webhook Payload

```json
{
  "source": "chinabridge_chat",
  "session_id": "uuid",
  "submitted_at": "2026-07-30T12:00:00Z",
  "lead": {
    "name": "Иван",
    "phone": "+7 777 000 00 00",
    "product": "велосипеды горные",
    "destination": "Казахстан, Алматы",
    "source": "website_chat"
  }
}
```
