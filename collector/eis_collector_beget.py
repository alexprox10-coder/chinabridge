#!/usr/bin/env python3
"""
Tender Intelligence Collector — Beget shared hosting edition
Только stdlib: ftplib, gzip, xml, urllib, json, logging
Запуск через CronTab в Beget Panel
"""

import os, sys, ftplib, gzip, json, logging, datetime, time
import xml.etree.ElementTree as ET
from urllib.request import urlopen, Request
from urllib.error import URLError
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

API_URL    = os.environ.get("CHINABRIDGE_API", "https://chinabridge.pro/api/admin/tender-import")
API_KEY    = os.environ.get("ADMIN_KEY", "")
TG_TOKEN   = os.environ.get("TG_BOT_TOKEN", "")
TG_CHAT_ID = os.environ.get("TG_CHAT_ID", "8979087725")

FTP_HOST   = "ftp.zakupki.gov.ru"
FTP_DIRS   = [
    ("/out/published/contractsfull/44fz",  "44fz"),
    ("/out/published/contractsfull/223fz", "223fz"),
]

# Файлы кладём рядом со скриптом
BASE_DIR   = Path(__file__).parent
WORK_DIR   = BASE_DIR / "data"
STATE_FILE = BASE_DIR / "state.json"
LOG_FILE   = BASE_DIR / "collector.log"

MIN_PRICE  = 500_000
BATCH_SIZE = 30

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

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler()],
)
log = logging.getLogger("collector")

# ── State ─────────────────────────────────────────────────────────────────────

def load_state():
    if STATE_FILE.exists():
        try: return json.loads(STATE_FILE.read_text())
        except: pass
    return {"done": [], "total_sent": 0}

def save_state(s):
    STATE_FILE.write_text(json.dumps(s, ensure_ascii=False, indent=2))

# ── FTP ───────────────────────────────────────────────────────────────────────

def ftp_list(ftp_dir, since):
    files = []
    try:
        with ftplib.FTP(FTP_HOST, timeout=30) as ftp:
            ftp.login()
            ftp.cwd(ftp_dir)
            lines = []
            ftp.retrlines("LIST", lines.append)
            for line in lines:
                parts = line.split()
                if not parts: continue
                fname = parts[-1]
                if not fname.endswith(".gz"): continue
                try:
                    ds = fname.split("_")[2]  # YYYYMMDD
                    d = datetime.date(int(ds[:4]), int(ds[4:6]), int(ds[6:8]))
                    if d < since: continue
                except: pass
                files.append(fname)
    except Exception as e:
        log.error(f"FTP list {ftp_dir}: {e}")
    return sorted(files)

def ftp_download(ftp_dir, fname, dest):
    try:
        with ftplib.FTP(FTP_HOST, timeout=60) as ftp:
            ftp.login()
            ftp.cwd(ftp_dir)
            with open(dest, "wb") as f:
                ftp.retrbinary(f"RETR {fname}", f.write)
        return True
    except Exception as e:
        log.error(f"FTP download {fname}: {e}")
        return False

# ── XML ───────────────────────────────────────────────────────────────────────

NS = {
    "ns2": "http://zakupki.gov.ru/oos/export/1",
    "ns3": "http://zakupki.gov.ru/oos/common/1",
    "ns4": "http://zakupki.gov.ru/oos/contract/1",
}

def _txt(el, path):
    e = el.find(path, NS)
    return e.text.strip() if e is not None and e.text else None

def _num(el, path):
    v = _txt(el, path)
    if not v: return 0.0
    try: return float(v.replace(" ","").replace(",","."))
    except: return 0.0

def parse_xml(gz_path, law_type):
    tenders = []
    try:
        with gzip.open(gz_path, "rb") as f:
            tree = ET.parse(f)
        root = tree.getroot()
    except Exception as e:
        log.error(f"XML parse {gz_path}: {e}")
        return []

    contracts = (root.findall(".//ns4:contract", NS)
                 or root.findall(".//contract")
                 or root.findall(".//{http://zakupki.gov.ru/oos/contract/1}contract"))

    for c in contracts:
        try:
            pnum = (_txt(c,"ns4:purchaseNumber") or _txt(c,"purchaseNumber") or "")
            if not pnum: continue

            subject = (_txt(c,".//ns4:subject") or _txt(c,".//subject") or "")
            price   = (_num(c,".//ns4:price") or _num(c,".//price"))
            if price < MIN_PRICE: continue

            winner = (_txt(c,".//ns4:supplier/ns3:organizationName")
                      or _txt(c,".//supplier/organizationName") or "")
            inn    = (_txt(c,".//ns4:supplier/ns3:INN")
                      or _txt(c,".//supplier/INN") or "")
            if not winner or not inn: continue

            customer = (_txt(c,".//ns4:customer/ns3:shortName")
                        or _txt(c,".//customer/shortName") or "")
            region   = (_txt(c,".//ns4:deliveryPlace")
                        or _txt(c,".//deliveryPlace") or None)
            okpd2    = (_txt(c,".//ns4:okpd2/ns3:code")
                        or _txt(c,".//okpd2/code") or "")
            pub_date = (_txt(c,".//ns4:signDate")
                        or _txt(c,".//signDate")
                        or datetime.datetime.utcnow().isoformat())
            reg_num  = (_txt(c,".//ns4:regNum") or _txt(c,".//regNum") or pnum)

            tenders.append({
                "tender_id":       f"eis-{reg_num}",
                "source":          f"eis_{law_type}",
                "purchase_number": pnum,
                "purchase_type":   "Государственный контракт",
                "law_type":        law_type,
                "customer":        customer,
                "customer_inn":    _txt(c,".//ns4:customer/ns3:INN"),
                "customer_region": region,
                "subject":         subject,
                "category":        f"ОКПД2 {okpd2[:2]}" if okpd2 else None,
                "description":     None,
                "quantity":        None,
                "unit":            None,
                "initial_price":   price,
                "final_price":     price,
                "currency":        "RUB",
                "publication_date": pub_date,
                "end_date":        None,
                "contract_date":   pub_date,
                "delivery_deadline": None,
                "delivery_region": region,
                "winner":          winner,
                "winner_inn":      inn,
                "winner_price":    price,
                "winner_rank":     1,
                "source_url":      f"https://zakupki.gov.ru/epz/contract/contractCard/common-info.html?reestrNumber={reg_num}",
            })
        except Exception as e:
            log.warning(f"contract parse: {e}")
    return tenders

# ── Filter ────────────────────────────────────────────────────────────────────

def relevant(t):
    cat = (t.get("category") or "").replace("ОКПД2 ","")[:2]
    if cat in CHINA_OKPD2: return True
    lc = (t.get("subject") or "").lower()
    return any(kw in lc for kw in CHINA_KEYWORDS)

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

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    state = load_state()
    done  = set(state.get("done", []))
    since = datetime.date.today() - datetime.timedelta(days=2)

    total_fetched = total_filtered = total_sent = total_crm = total_hot = 0
    errors = []

    for ftp_dir, law_type in FTP_DIRS:
        log.info(f"[{law_type}] listing {ftp_dir}")
        files = ftp_list(ftp_dir, since)
        new   = [f for f in files if f not in done]
        log.info(f"[{law_type}] {len(files)} total, {len(new)} new")

        for fname in new:
            dest = WORK_DIR / fname
            log.info(f"Downloading {fname}")
            if not ftp_download(ftp_dir, fname, dest):
                errors.append(f"download: {fname}")
                continue

            tenders = parse_xml(dest, law_type)
            total_fetched += len(tenders)

            rel = [t for t in tenders if relevant(t)]
            total_filtered += len(rel)
            log.info(f"{fname}: parsed={len(tenders)} relevant={len(rel)}")

            for i in range(0, len(rel), BATCH_SIZE):
                r = post_batch(rel[i:i+BATCH_SIZE])
                if r.get("ok"):
                    total_sent += r.get("new_saved", 0)
                    total_crm  += r.get("crm_created", 0)
                    total_hot  += r.get("hot_found", 0)
                    log.info(f"  batch: saved={r.get('new_saved')} crm={r.get('crm_created')} hot={r.get('hot_found')}")
                else:
                    errors.append(f"api: {r.get('error')}")
                time.sleep(2)

            dest.unlink(missing_ok=True)
            done.add(fname)

    state["done"] = list(done)[-500:]
    state["last_run"] = datetime.datetime.utcnow().isoformat()
    state["total_sent"] = state.get("total_sent", 0) + total_sent
    save_state(state)

    msg = (
        f"📊 <b>Tender Collector</b> {datetime.date.today()}\n\n"
        f"• Спарсено: <b>{total_fetched}</b>\n"
        f"• China-релевантных: <b>{total_filtered}</b>\n"
        f"• Сохранено новых: <b>{total_sent}</b>\n"
        f"• CRM лидов: <b>{total_crm}</b>\n"
        f"• 🔥 HOT: <b>{total_hot}</b>\n"
    )
    if errors:
        msg += f"\n⚠️ Ошибки: {len(errors)}\n" + "\n".join(errors[:3])

    log.info(f"Done: fetched={total_fetched} filtered={total_filtered} sent={total_sent} crm={total_crm} hot={total_hot}")
    tg(msg)

if __name__ == "__main__":
    main()
