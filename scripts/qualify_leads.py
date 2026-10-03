"""
ChinaBridge — AI Lead Qualification
====================================
Pipeline:
  outreach_contacts (status=new, qualified_at IS NULL)
    → Firecrawl (парсим сайт)
    → Claude API (анализ + Lead Score A/B/C/D + готовое КП)
    → сохраняем обратно в outreach_contacts

Запуск:
  python scripts/qualify_leads.py --limit 50
  python scripts/qualify_leads.py --limit 50 --score-only   # без Firecrawl
  python scripts/qualify_leads.py --requalify --lead-score C --limit 100

Переменные окружения:
  FIRECRAWL_API_KEY  — https://firecrawl.dev (free 500 pages/month)
  ANTHROPIC_API_KEY  — https://console.anthropic.com
  DATABASE_URL       — postgresql://user:pass@host/chinabridge
  CLAUDE_MODEL       — claude-sonnet-4-5 (default) или claude-opus-4-5
"""

import os
import re
import json
import argparse
import psycopg2
import psycopg2.extras
import requests
from datetime import datetime, timezone

# ─── Конфиг ──────────────────────────────────────────────────────────────────

FIRECRAWL_API_KEY  = os.environ.get("FIRECRAWL_API_KEY", "")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
DATABASE_URL       = os.environ.get("DATABASE_URL", "")

# google/gemini-flash-1.5 — в 5x умнее gpt-4o-mini, дешевле gpt-4o
AI_MODEL        = os.environ.get("AI_MODEL", "google/gemini-flash-1.5")
OPENROUTER_BASE = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

FIRECRAWL_MAX_CHARS = 3000
AI_MAX_TOKENS       = 1800

# ─── Промпт ──────────────────────────────────────────────────────────────────

QUALIFICATION_PROMPT = """\
Ты — B2B квалификатор лидов для ChinaBridge (импорт товаров из Китая в РФ/КЗ).
ChinaBridge берёт на себя: поиск поставщика, переговоры, контроль качества, \
логистику, таможню. Клиент получает товар на склад под ключ.

КЛЮЧЕВОЙ РЫНОЧНЫЙ КОНТЕКСТ (используй в анализе):
- После 2022 из РФ ушли: Liqui Moly, Castrol, Shell, SKF, Bosch, многие европейские бренды
- Китайские аналоги (Great Wall, Sinopec, ZIC, NTN, FAG China) закрыли 60-80% дефицита
- Прямой импорт через ChinaBridge = минус 2 наценки дистрибьютора
- Маркетплейсы (WB/Ozon) требуют постоянный товар → высокий объём закупок

Данные компании:
- Название: {company_name}
- Регион: {region}
- ОКВЭД: {okved} — {okved_description}
- Выручка: {revenue} млн ₽/год
- Сотрудников: {employees}
- Директор: {director}
- Телефон: {phone}
- Email: {email}
- Сайт: {website}
- Описание: {description}

{website_content}

Дай строго структурированный анализ:

## ПРОФИЛЬ БИЗНЕСА
**Основной канал продаж:** [опт / розница / дистрибьюторы / производство]
**География клиентов:** [местный / региональный / федеральный]
**Бизнес-модель:** [перепродажа / производство / сервис]

## СВЯЗЬ С КИТАЕМ
**Что продают/используют сейчас:** [конкретные товарные категории]
**Что из этого идёт из Китая:** [конкретные позиции или логика рынка]
**Что везти через ChinaBridge:** [2-3 конкретные товарные группы]
**Триггер переключения:** [цена / дефицит после 2022 / уход западных брендов / ассортимент]

## БОЛЬ
**Главная боль:** [одна конкретная фраза, не шаблон]
**Доказательство:** [факт с сайта или рыночный контекст]

## КВАЛИФИКАЦИЯ
**Объём закупок:** [разовые партии / регулярные поставки / крупный опт]
**Цикл сделки:** [быстрый 1-2 мес / средний 3-4 мес / долгий 6+ мес]
**Стоп-факторы:** [ГОСТ/сертификация / госконтракты / уже напрямую с Китаем / нет]
**ЛПР:** [директор сам / закупщик / совет — есть ли контакт]

## ПРИОРИТЕТ
**Lead Score: [A / B / C / D]**
**Обоснование:** [2-3 предложения]

Скоринг:
- A = выручка 100М+, категория явно связана с Китаем, прямой контакт ЛПР, нет стоп-факторов
- B = выручка 30-100М или косвенная связь с Китаем, контакт есть
- C = малый бизнес или слабая связь с Китаем
- D = госструктура / ГОСТ-производство / нет смысла / уже напрямую с Китаем

## КП — ПЕРВОЕ СООБЩЕНИЕ
[Сообщение для WhatsApp/Telegram от ChinaBridge.
Обращение по имени директора, конкретный товар из их ниши,
конкретная выгода (цена/сроки/дефицит), 4-6 предложений,
деловой тон без "предлагаем сотрудничество".]
"""

# ─── Firecrawl ────────────────────────────────────────────────────────────────

def scrape_website(url: str) -> str | None:
    if not url or url in ("—", "нет", ""):
        return None
    if not FIRECRAWL_API_KEY:
        return None
    if not url.startswith("http"):
        url = "https://" + url

    try:
        r = requests.post(
            "https://api.firecrawl.dev/v1/scrape",
            headers={
                "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "url": url,
                "formats": ["markdown"],
                "onlyMainContent": True,
                "excludeTags": ["nav", "footer", "header", "script", "style"],
                "maxAge": 86400,
                "timeout": 15000,
            },
            timeout=20,
        )
        if r.status_code == 200:
            content = r.json().get("data", {}).get("markdown", "") or ""
            return content[:FIRECRAWL_MAX_CHARS] if content else None
        print(f"  Firecrawl {r.status_code}: {r.text[:200]}")
        return None
    except requests.exceptions.Timeout:
        print(f"  Timeout: {url}")
        return None
    except Exception as e:
        print(f"  Firecrawl error: {e}")
        return None


# ─── Claude API ───────────────────────────────────────────────────────────────

def qualify_with_ai(company: dict, website_content: str | None) -> dict:
    website_section = (
        f"\n## ДАННЫЕ С САЙТА\n{website_content}\n"
        if website_content
        else "\n## ДАННЫЕ С САЙТА: недоступен\n"
    )

    safe = {k: (str(v) if v is not None else "—") for k, v in company.items()}
    prompt = QUALIFICATION_PROMPT.format(**safe, website_content=website_section)

    assert OPENROUTER_API_KEY, "Нужен OPENROUTER_API_KEY"
    base = OPENROUTER_BASE.rstrip("/")

    r = requests.post(
        f"{base}/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://chinabridge.pro",
            "X-Title": "ChinaBridge Lead Qualification",
        },
        json={
            "model": AI_MODEL,
            "max_tokens": AI_MAX_TOKENS,
            "temperature": 0.3,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=60,
    )
    r.raise_for_status()
    data = r.json()

    text = data["choices"][0]["message"]["content"]
    tokens = data.get("usage", {})
    total_tokens = tokens.get("total_tokens", tokens.get("prompt_tokens", 0) + tokens.get("completion_tokens", 0))

    return {
        "analysis":       text,
        "lead_score":     _extract(r"Lead Score:\s*\*?\*?([ABCD])\*?\*?", text, "C"),
        "sales_channel":  _extract(r"\*\*Основной канал продаж:\*\*\s*(.+)", text),
        "stop_factors":   _extract(r"\*\*Стоп-факторы:\*\*\s*(.+)", text),
        "china_products": _extract(r"\*\*Что везти через ChinaBridge:\*\*\s*(.+)", text),
        "deal_cycle":     _extract(r"\*\*Цикл сделки:\*\*\s*(.+)", text),
        "kp_message":     _extract_kp(text),
        "tokens_used":    total_tokens,
    }


def _extract(pattern: str, text: str, default: str = None) -> str | None:
    m = re.search(pattern, text)
    return m.group(1).strip() if m else default


def _extract_kp(text: str) -> str | None:
    m = re.search(r"## КП — ПЕРВОЕ СООБЩЕНИЕ\s*\n(.+?)(?=\n##|\Z)", text, re.DOTALL)
    if m:
        return re.sub(r"^\[|\]$", "", m.group(1).strip()).strip()
    return None


# ─── БД ──────────────────────────────────────────────────────────────────────

def get_leads(conn, limit: int, requalify: bool, rescore: str | None) -> list[dict]:
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        if requalify and rescore:
            cur.execute("""
                SELECT id, company_name, region, okvad AS okved,
                       okvad_name->>'okvad_full' AS okved_description,
                       revenue, employees,
                       okvad_name->>'director' AS director,
                       phone, email,
                       okvad_name->>'site_url' AS website,
                       okvad_name->>'description' AS description
                FROM outreach_contacts
                WHERE source = 'kontur_compass'
                  AND lead_score = %s
                ORDER BY revenue DESC NULLS LAST
                LIMIT %s
            """, (rescore, limit))
        else:
            cur.execute("""
                SELECT id, company_name, region, okvad AS okved,
                       okvad_name->>'okvad_full' AS okved_description,
                       revenue, employees,
                       okvad_name->>'director' AS director,
                       phone, email,
                       okvad_name->>'site_url' AS website,
                       okvad_name->>'description' AS description
                FROM outreach_contacts
                WHERE source = 'kontur_compass'
                  AND qualified_at IS NULL
                ORDER BY revenue DESC NULLS LAST
                LIMIT %s
            """, (limit,))
        return [dict(r) for r in cur.fetchall()]


def save_result(conn, company_id: int, result: dict, scraped: bool):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE outreach_contacts SET
                lead_score       = %s,
                ai_analysis      = %s,
                website_scraped  = %s,
                qualified_at     = %s,
                tokens_used      = %s,
                sales_channel    = %s,
                stop_factors     = %s,
                china_products   = %s,
                deal_cycle       = %s,
                outreach_message = %s,
                status           = CASE WHEN status IN ('new','analyzing') THEN 'kp_ready' ELSE status END
            WHERE id = %s
        """, (
            result["lead_score"],
            result["analysis"],
            scraped,
            datetime.now(timezone.utc),
            result["tokens_used"],
            result.get("sales_channel"),
            result.get("stop_factors"),
            result.get("china_products"),
            result.get("deal_cycle"),
            result.get("kp_message"),
            company_id,
        ))
    conn.commit()


# ─── Главный цикл ────────────────────────────────────────────────────────────

def run(limit: int, score_only: bool, requalify: bool, rescore: str | None):
    assert OPENROUTER_API_KEY, "Нужен OPENROUTER_API_KEY"
    assert DATABASE_URL, "Нужен DATABASE_URL"

    conn = psycopg2.connect(DATABASE_URL)
    leads = get_leads(conn, limit, requalify, rescore)

    if not leads:
        print("Нет лидов для квалификации.")
        conn.close()
        return

    print(f"Квалифицируем {len(leads)} лидов (модель: {AI_MODEL})")
    print(f"Firecrawl: {'выкл (--score-only)' if score_only else 'вкл'}\n")

    stats = {"A": 0, "B": 0, "C": 0, "D": 0, "errors": 0, "total_tokens": 0}

    for i, company in enumerate(leads):
        company_id = company.pop("id")
        name = company.get("company_name", "—")
        site = company.get("website") or "—"

        print(f"[{i+1}/{len(leads)}] {name}")

        scraped_content = None
        if not score_only and site != "—":
            print(f"  → scraping {site}...")
            scraped_content = scrape_website(site)
            chars = len(scraped_content) if scraped_content else 0
            print(f"  → {'✓ ' + str(chars) + ' chars' if scraped_content else '✗ не спарсили'}")

        try:
            result = qualify_with_ai(company, scraped_content)
            save_result(conn, company_id, result, scraped_content is not None)

            score = result["lead_score"]
            stats[score] = stats.get(score, 0) + 1
            stats["total_tokens"] += result["tokens_used"]

            snippet = (result.get("china_products") or "")[:60]
            print(f"  ✓ Score: {score} | {result['tokens_used']} токенов | {snippet}")

        except Exception as e:
            print(f"  ✗ Error: {e}")
            stats["errors"] += 1

    conn.close()

    total = sum(stats.get(k, 0) for k in "ABCD")
    # gemini-flash-1.5: $0.075/1M input, $0.30/1M output (≈ $0.000000075/tok avg)
    cost = stats["total_tokens"] * (0.0000002 if "gemini" in AI_MODEL else 0.000003)

    print(f"\n{'─'*50}")
    print(f"  Готово: {total} лидов")
    print(f"  A: {stats.get('A',0)}  B: {stats.get('B',0)}  C: {stats.get('C',0)}  D: {stats.get('D',0)}")
    print(f"  Ошибки: {stats['errors']}")
    print(f"  Токены: {stats['total_tokens']:,} (~${cost:.2f})")
    print(f"\n  A+B лиды: psql $DATABASE_URL -c 'SELECT * FROM v_hot_leads LIMIT 20;'")


# ─── CLI ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ChinaBridge Lead Qualification")
    parser.add_argument("--limit",      type=int, default=50)
    parser.add_argument("--score-only", action="store_true", help="Без Firecrawl")
    parser.add_argument("--requalify",  action="store_true", help="Переквалифицировать")
    parser.add_argument("--lead-score", type=str, default=None, help="Фильтр скора для --requalify")
    args = parser.parse_args()

    run(
        limit=args.limit,
        score_only=args.score_only,
        requalify=args.requalify,
        rescore=args.lead_score,
    )
