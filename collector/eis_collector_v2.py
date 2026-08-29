#!/usr/bin/env python3
"""
Tender Intelligence Collector v2 — HTTPS scraping ЕИС (закупки.gov.ru)
Stdlib only: urllib, ssl, json, re, logging
Не требует pip install
"""

import os, sys, json, logging, datetime, time, re, ssl
from urllib.request import urlopen, Request
from urllib.error import URLError
from urllib.parse import quote
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

API_URL    = os.environ.get("CHINABRIDGE_API", "https://chinabridge.pro/api/admin/tender-import")
API_KEY    = os.environ.get("ADMIN_KEY", "")
TG_TOKEN   = os.environ.get("TG_BOT_TOKEN", "")
TG_CHAT_ID = os.environ.get("TG_CHAT_ID", "8979087725")

BASE_DIR   = Path(__file__).parent
STATE_FILE = BASE_DIR / "state_v2.json"
LOG_FILE   = BASE_DIR / "collector_v2.log"

MIN_PRICE  = 500_000
BATCH_SIZE = 20
DAYS_BACK  = 14  # fetch contracts signed in last N days

# ОКПД2 с высоким China Fit (первые 2 цифры)
CHINA_OKPD2 = {"26","27","28","29","30","31","32","13","14","15","22","23","25","33"}

CHINA_KEYWORDS = [
    "оборудование","электроника","светильник","мебель","компьютер","принтер",
    "монитор","сервер","насос","компрессор","генератор","трансформатор",
    "кабель","провод","инструмент","запчасти","автозапчасти","комплектующие",
    "расходные материалы","спецтехника","медицинское оборудование","тонометр",
    "станок","вентилятор","кондиционер","радиатор","котел","фильтр",
    "упаковка","стеллаж","шкаф металлический","светодиод","прожектор",
]

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler()],
)
log = logging.getLogger("collector_v2")

# ── SSL context (bypass Russian gov CA) ───────────────────────────────────────

def get_ssl_ctx():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx

SSL_CTX = get_ssl_ctx()

# ── State ─────────────────────────────────────────────────────────────────────

def load_state():
    if STATE_FILE.exists():
        try: return json.loads(STATE_FILE.read_text())
        except: pass
    return {"done": [], "total_sent": 0}

def save_state(s):
    STATE_FILE.write_text(json.dumps(s, ensure_ascii=False, indent=2))

# ── HTTP ─────────────────────────────────────────────────────────────────────

def fetch(url, retries=3):
    req = Request(url, headers={"User-Agent": UA, "Accept-Language": "ru-RU,ru;q=0.9"})
    for attempt in range(retries):
        try:
            with urlopen(req, context=SSL_CTX, timeout=25) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except Exception as e:
            log.warning(f"fetch attempt {attempt+1}/{retries}: {e}")
            if attempt < retries - 1:
                time.sleep(5 * (attempt + 1))
    return None

# ── HTML parsing ──────────────────────────────────────────────────────────────

def clean_html(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s)).strip()

def extract_after_title(html, title):
    """Extract value in data-block__value after a data-block__title with given text."""
    pattern = rf'{re.escape(title)}.*?<div class="data-block__value">(.*?)</div>'
    m = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
    return clean_html(m.group(1)) if m else None

def extract_price(block):
    """Extract contract price from price-block__value."""
    m = re.search(r'price-block__value[^>]*>(.*?)</div>', block, re.DOTALL)
    if not m:
        return 0.0
    text = clean_html(m.group(1))
    digits = re.sub(r"[^\d,.]", "", text).replace(",", ".")
    try:
        return float(digits.rstrip("."))
    except:
        return 0.0

def parse_search_page(html):
    """Parse search results page; return list of partial contract dicts."""
    contracts = []
    blocks = re.split(r'search-registry-entry-block', html)[1:]

    for block in blocks:
        try:
            # reestrNumber
            m = re.search(r'reestrNumber=(\d+)', block)
            if not m:
                continue
            reestr = m.group(1)

            # subject (Объекты закупки)
            subject = None
            subj_m = re.search(r'lots-wrap-content__body__val[^>]*>.*?<span[^>]*>(.*?)</span>', block, re.DOTALL)
            if subj_m:
                subject = clean_html(subj_m.group(1))

            # price
            price = extract_price(block)

            # customer
            cust_m = re.search(r'registry-entry__body-title[^>]*>.*?Заказчик.*?registry-entry__body-href[^>]*>.*?<a[^>]*>(.*?)</a>', block, re.DOTALL)
            customer = clean_html(cust_m.group(1)) if cust_m else None

            # contract date
            date_m = re.search(r'Заключение контракта.*?data-block__value[^>]*>(.*?)</div>', block, re.DOTALL)
            contract_date = clean_html(date_m.group(1)) if date_m else None

            # region from customer name heuristic — get from card later
            contracts.append({
                "reestr":        reestr,
                "subject":       subject,
                "price":         price,
                "customer":      customer,
                "contract_date": contract_date,
            })
        except Exception as e:
            log.warning(f"block parse error: {e}")

    return contracts

def parse_contract_card(html):
    """Fetch supplier name and INN from contract card page."""
    # Strip HTML and search in clean text (INNs are split by tags in raw HTML)
    clean_text = re.sub(r"<[^>]+>", " ", html)
    clean_text = re.sub(r"\s+", " ", clean_text)

    # All INNs in document: customer INN first, supplier INN second
    inns = re.findall(r"ИНН[:\s]+(\d{10,12})", clean_text)
    supplier_inn = inns[1] if len(inns) >= 2 else (inns[0] if inns else None)

    # Supplier name: find org name in "Информация о поставщиках" section
    supplier_name = None
    supp_idx = clean_text.find("Информация о поставщиках")
    if supp_idx > 0:
        section = clean_text[supp_idx:supp_idx + 2000]
        # Skip past table headers
        skip_until = max(
            section.find("Статус"),
            section.find("электронная почта"),
        )
        if skip_until > 0:
            section = section[skip_until:]
        # Match org-type abbreviation up to ИНН/КПП/ОГРН boundary
        name_m = re.search(
            r"((?:ООО|ОАО|ЗАО|АО|ИП|ФГУП|МУП|ГУП|ФКУ|ФГБУ|ФГКУ|МКУ|МБУ|ОГРНИП).{5,200}?)(?:\s+ИНН|\s+КПП|\s+ОГРН)",
            section,
        )
        if name_m:
            raw_name = re.sub(r"\s+", " ", name_m.group(1)).strip().rstrip(") ")
            supplier_name = raw_name[:200]
        else:
            # Fallback: grab first sizeable chunk that looks like an org name
            words = section.split()
            org_tokens = []
            for w in words[:50]:
                if w in ("Страна,", "Адрес", "Почтовый", "Телефон,", "Статус", "ИНН:", "КПП:", "ОГРН:", "субъект", "малого"):
                    break
                org_tokens.append(w)
            candidate = " ".join(org_tokens).strip()
            if len(candidate) > 5:
                supplier_name = candidate[:200]

    # OKPD2
    okpd2_m = re.search(r"ОКПД\s*2?[:\s]+([\d.]+)", clean_text)
    okpd2 = okpd2_m.group(1) if okpd2_m else None

    # Region from delivery address
    region_m = re.search(r"(?:Место доставки|Адрес поставки)[:\s]+(.{5,100}?)(?:Срок|ИНН|Цена|$)", clean_text, re.IGNORECASE)
    region = re.sub(r"\s+", " ", region_m.group(1)).strip()[:100] if region_m else None

    return {
        "supplier_inn":  supplier_inn,
        "supplier_name": supplier_name,
        "okpd2":         okpd2,
        "region":        region,
    }

# ── Relevance filter ──────────────────────────────────────────────────────────

def relevant(subject, okpd2):
    if okpd2:
        code2 = okpd2[:2]
        if code2 in CHINA_OKPD2:
            return True
    lc = (subject or "").lower()
    return any(kw in lc for kw in CHINA_KEYWORDS)

# Поиск по ключевым словам — эффективнее чем фильтр по дате
SEARCH_QUERIES = [
    "электроника", "оборудование", "компьютер", "принтер", "монитор",
    "кабель", "светильник", "насос", "компрессор", "генератор",
    "инструмент", "запчасти", "станок", "вентилятор", "кондиционер",
    "мебель", "стеллаж", "упаковка", "медицинское оборудование",
]

# ── EIS search ────────────────────────────────────────────────────────────────

def search_contracts(query, page=1):
    """Search contracts page on ЕИС by keyword."""
    url = (
        f"https://zakupki.gov.ru/epz/contract/search/results.html"
        f"?searchString={quote(query)}&fz44=on&fz223=on&morphology=on"
        f"&pageNumber={page}&sortDirection=false&recordsPerPage=_50"
        f"&showLotsInfoHidden=false"
    )
    return fetch(url)

def get_total_pages(html):
    m = re.search(r'totalCount[^>]*>(\d+)', html)
    if m:
        total = int(m.group(1))
        return (total + 49) // 50  # 50 per page
    # Count pagination links
    pages = re.findall(r'pageNumber=(\d+)', html)
    if pages:
        return max(int(p) for p in pages)
    return 1

# ── API ───────────────────────────────────────────────────────────────────────

def post_batch(batch):
    data = json.dumps(batch).encode()
    req = Request(API_URL, data=data, headers={
        "Content-Type": "application/json",
        "X-Admin-Key": API_KEY,
    })
    for attempt in range(3):
        try:
            with urlopen(req, timeout=120) as resp:
                return json.loads(resp.read())
        except Exception as e:
            log.warning(f"API attempt {attempt+1}/3: {e}")
            if attempt < 2: time.sleep(10)
    return {"ok": False, "error": "retries exhausted"}

# ── Telegram ──────────────────────────────────────────────────────────────────

def tg(text):
    if not TG_TOKEN: return
    try:
        data = json.dumps({"chat_id": TG_CHAT_ID, "text": text, "parse_mode": "HTML"}).encode()
        req = Request(f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage",
                      data=data, headers={"Content-Type": "application/json"})
        urlopen(req, timeout=10)
    except: pass

# ── ISO date ──────────────────────────────────────────────────────────────────

def ru_date_to_iso(d):
    """Convert dd.mm.yyyy to ISO."""
    try:
        parts = d.strip().split(".")
        return f"{parts[2]}-{parts[1]}-{parts[0]}"
    except:
        return datetime.datetime.utcnow().date().isoformat()

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    state = load_state()
    done  = set(state.get("done", []))

    log.info(f"[v2] Keyword search mode — {len(SEARCH_QUERIES)} queries")

    all_partials = []
    seen_reestr = set()

    for query in SEARCH_QUERIES:
        html1 = search_contracts(query, page=1)
        if not html1:
            log.warning(f"Failed to fetch query '{query}'")
            continue

        total_pages = get_total_pages(html1)
        partials = parse_search_page(html1)

        for page in range(2, min(total_pages + 1, 4)):  # max 3 pages per keyword = 150 contracts
            time.sleep(1)
            html = search_contracts(query, page=page)
            if html:
                partials.extend(parse_search_page(html))

        # Deduplicate across queries
        for p in partials:
            if p["reestr"] not in seen_reestr:
                seen_reestr.add(p["reestr"])
                all_partials.append(p)

        log.info(f"Query '{query}': pages={total_pages} found={len(partials)}")
        time.sleep(2)

    log.info(f"Parsed {len(all_partials)} contracts from search pages")

    # Filter by price and deduplicate
    candidates = [c for c in all_partials
                  if c["price"] >= MIN_PRICE and c["reestr"] not in done]
    log.info(f"Candidates (price >= {MIN_PRICE}, new): {len(candidates)}")

    # All price-filtered candidates go to card fetch; OKPD2 check happens after
    relevant_partials = candidates
    log.info(f"Candidates for card fetch: {len(relevant_partials)}")

    # Fetch contract cards for relevant ones to get supplier data
    tenders_to_send = []
    for partial in relevant_partials:
        reestr = partial["reestr"]
        card_url = f"https://zakupki.gov.ru/epz/contract/contractCard/common-info.html?reestrNumber={reestr}"
        log.info(f"Fetching card: {reestr}")
        card_html = fetch(card_url)
        time.sleep(1)

        if not card_html:
            log.warning(f"Failed to fetch card for {reestr}")
            done.add(reestr)
            continue

        card_data = parse_contract_card(card_html)

        supplier_inn  = card_data.get("supplier_inn")
        supplier_name = card_data.get("supplier_name")
        okpd2         = card_data.get("okpd2")
        region        = card_data.get("region")

        if not supplier_inn:
            log.info(f"No supplier INN for {reestr} — skip")
            done.add(reestr)
            continue

        # Keyword search guarantees subject relevance; skip strict OKPD2 re-check

        contract_date_iso = ru_date_to_iso(partial.get("contract_date") or "")

        tenders_to_send.append({
            "tender_id":        f"eis-{reestr}",
            "source":           "eis_44fz",
            "purchase_number":  reestr,
            "purchase_type":    "Государственный контракт",
            "law_type":         "44fz",
            "customer":         partial.get("customer") or "",
            "customer_inn":     None,
            "customer_region":  region,
            "subject":          partial.get("subject") or "",
            "category":         f"ОКПД2 {okpd2[:2]}" if okpd2 else None,
            "description":      None,
            "quantity":         None,
            "unit":             None,
            "initial_price":    partial["price"],
            "final_price":      partial["price"],
            "currency":         "RUB",
            "publication_date": contract_date_iso,
            "end_date":         None,
            "contract_date":    contract_date_iso,
            "delivery_deadline": None,
            "delivery_region":  region,
            "winner":           supplier_name or f"ИНН {supplier_inn}",
            "winner_inn":       supplier_inn,
            "winner_price":     partial["price"],
            "winner_rank":      1,
            "source_url":       f"https://zakupki.gov.ru/epz/contract/contractCard/common-info.html?reestrNumber={reestr}",
        })
        done.add(reestr)

    log.info(f"Ready to send: {len(tenders_to_send)}")

    total_sent = total_crm = total_hot = 0
    errors = []

    for i in range(0, len(tenders_to_send), BATCH_SIZE):
        batch = tenders_to_send[i:i+BATCH_SIZE]
        r = post_batch(batch)
        if r.get("ok"):
            total_sent += r.get("new_saved", 0)
            total_crm  += r.get("crm_created", 0)
            total_hot  += r.get("hot_found", 0)
            log.info(f"  batch {i//BATCH_SIZE+1}: saved={r.get('new_saved')} crm={r.get('crm_created')} hot={r.get('hot_found')}")
        else:
            errors.append(f"api: {r.get('error')}")
        time.sleep(2)

    state["done"] = list(done)[-500:]
    state["last_run"] = datetime.datetime.utcnow().isoformat()
    state["total_sent"] = state.get("total_sent", 0) + total_sent
    save_state(state)

    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    msg = (
        f"📊 <b>Tender Collector v2</b> {today}\n\n"
        f"• Контрактов найдено: <b>{len(all_partials)}</b>\n"
        f"• China-релевантных: <b>{len(relevant_partials)}</b>\n"
        f"• Отправлено в ChinaBridge: <b>{total_sent}</b>\n"
        f"• CRM лидов: <b>{total_crm}</b>\n"
        f"• 🔥 HOT: <b>{total_hot}</b>\n"
    )
    if errors:
        msg += f"\n⚠️ Ошибки: {len(errors)}"

    log.info(f"Done. sent={total_sent} crm={total_crm} hot={total_hot}")
    tg(msg)

if __name__ == "__main__":
    main()
