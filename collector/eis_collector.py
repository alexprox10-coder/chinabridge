#!/usr/bin/env python3
"""
Tender Intelligence Collector v1
Читает официальные XML-выгрузки ЕИС с FTP zakupki.gov.ru
Фильтрует по категориям, сумме, нормализует, шлёт на ChinaBridge API

Запуск: python3 eis_collector.py
Cron:   0 */4 * * * /opt/collector/venv/bin/python3 /opt/collector/eis_collector.py
"""

import os
import ftplib
import gzip
import xml.etree.ElementTree as ET
import json
import logging
import hashlib
import time
import datetime
import requests
from pathlib import Path
from typing import Optional

# ── Config ────────────────────────────────────────────────────────────────────

API_URL      = os.environ.get("CHINABRIDGE_API", "https://chinabridge.pro/api/admin/tender-import")
API_KEY      = os.environ.get("ADMIN_KEY", "")  # = CRON_SECRET из Vercel
TG_TOKEN     = os.environ.get("TG_BOT_TOKEN", "")
TG_CHAT_ID   = os.environ.get("TG_CHAT_ID", "8979087725")

FTP_HOST     = "ftp.zakupki.gov.ru"
FTP_DIR_44   = "/out/published/contractsfull/44fz"   # реестр контрактов 44-ФЗ
FTP_DIR_223  = "/out/published/contractsfull/223fz"  # реестр контрактов 223-ФЗ

WORK_DIR     = Path("/opt/collector/data")
STATE_FILE   = Path("/opt/collector/state.json")
LOG_FILE     = Path("/opt/collector/collector.log")

MIN_PRICE    = 500_000   # ₽ — ниже не берём
BATCH_SIZE   = 50        # сколько тендеров шлём за один POST

# ОКПД2 коды с потенциалом Chinese import (первые 2 цифры)
CHINA_FIT_OKPD2 = {
    "26", "27", "28", "29", "30",  # электроника, оборудование, транспорт
    "31", "32",                     # мебель, прочие изделия
    "13", "14", "15",               # текстиль, одежда, обувь
    "22", "23", "25",               # резина, стекло, металлические изделия
    "33",                           # ремонт оборудования
}

# Ключевые слова в subject для дополнительного фильтра
CHINA_KEYWORDS = [
    "оборудование", "электроника", "светильник", "мебель", "компьютер",
    "принтер", "монитор", "сервер", "насос", "компрессор", "генератор",
    "трансформатор", "кабель", "провод", "инструмент", "запчасти",
    "автозапчасти", "комплектующие", "расходные материалы", "спецтехника",
    "медицинское оборудование", "тонометр", "пульсоксиметр", "термометр",
    "станок", "пресс", "конвейер", "вентилятор", "кондиционер",
    "радиатор", "котел", "горелка", "насосная станция", "фильтр",
    "упаковка", "тара", "контейнер", "стеллаж", "шкаф металлический",
    "велосипед", "самокат", "спортивный инвентарь", "игрушки",
]

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("eis_collector")

# ── State ─────────────────────────────────────────────────────────────────────

def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {"processed_files": [], "last_run": None, "total_sent": 0}

def save_state(state: dict):
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2))

# ── FTP ───────────────────────────────────────────────────────────────────────

def list_ftp_files(ftp_dir: str, since_date: Optional[datetime.date] = None) -> list[str]:
    """Возвращает список gz-файлов на FTP (новее since_date если указана)."""
    files = []
    try:
        with ftplib.FTP(FTP_HOST, timeout=30) as ftp:
            ftp.login()
            ftp.cwd(ftp_dir)
            entries = []
            ftp.retrlines("LIST", entries.append)
            for entry in entries:
                parts = entry.split()
                if not parts:
                    continue
                fname = parts[-1]
                if not fname.endswith(".gz"):
                    continue
                # Имя файла содержит дату: contracts_44fz_YYYYMMDD_NNNN.xml.gz
                if since_date:
                    try:
                        date_str = fname.split("_")[2]  # YYYYMMDD
                        file_date = datetime.date(int(date_str[:4]), int(date_str[4:6]), int(date_str[6:8]))
                        if file_date < since_date:
                            continue
                    except (IndexError, ValueError):
                        pass
                files.append(fname)
    except Exception as e:
        log.error(f"FTP list failed ({ftp_dir}): {e}")
    return sorted(files)

def download_ftp_file(ftp_dir: str, filename: str, dest: Path) -> bool:
    """Скачивает файл с FTP в dest."""
    try:
        with ftplib.FTP(FTP_HOST, timeout=60) as ftp:
            ftp.login()
            ftp.cwd(ftp_dir)
            with open(dest, "wb") as f:
                ftp.retrbinary(f"RETR {filename}", f.write)
        return True
    except Exception as e:
        log.error(f"FTP download failed ({filename}): {e}")
        return False

# ── XML Parser ────────────────────────────────────────────────────────────────

NS = {
    "ns2": "http://zakupki.gov.ru/oos/export/1",
    "ns3": "http://zakupki.gov.ru/oos/common/1",
    "ns4": "http://zakupki.gov.ru/oos/contract/1",
}

def safe_text(element, path: str, ns: dict = NS) -> Optional[str]:
    el = element.find(path, ns)
    return el.text.strip() if el is not None and el.text else None

def safe_float(element, path: str, ns: dict = NS) -> float:
    v = safe_text(element, path, ns)
    if not v:
        return 0.0
    try:
        return float(v.replace(" ", "").replace(",", "."))
    except ValueError:
        return 0.0

def parse_contract_xml(gz_path: Path, law_type: str) -> list[dict]:
    """Парсит XML-выгрузку контрактов ЕИС, возвращает нормализованные тендеры."""
    tenders = []
    try:
        with gzip.open(gz_path, "rb") as f:
            tree = ET.parse(f)
        root = tree.getroot()
    except Exception as e:
        log.error(f"XML parse failed ({gz_path}): {e}")
        return []

    # Контракты могут быть в разных тегах в зависимости от версии схемы
    contracts = (
        root.findall(".//ns4:contract", NS)
        or root.findall(".//contract")
        or root.findall(".//{http://zakupki.gov.ru/oos/contract/1}contract")
    )

    for contract in contracts:
        try:
            purchase_number = (
                safe_text(contract, "ns4:purchaseNumber", NS)
                or safe_text(contract, "purchaseNumber")
                or safe_text(contract, "ns2:purchaseNumber", NS)
            )
            if not purchase_number:
                continue

            subject = (
                safe_text(contract, ".//ns4:subject", NS)
                or safe_text(contract, ".//subject")
                or ""
            )

            final_price = (
                safe_float(contract, ".//ns4:price", NS)
                or safe_float(contract, ".//price")
            )
            if final_price < MIN_PRICE:
                continue

            # Победитель
            winner_name = (
                safe_text(contract, ".//ns4:supplier/ns3:organizationName", NS)
                or safe_text(contract, ".//supplier/organizationName")
                or safe_text(contract, ".//ns4:supplierInfo/ns4:organizationName", NS)
                or ""
            )
            winner_inn = (
                safe_text(contract, ".//ns4:supplier/ns3:INN", NS)
                or safe_text(contract, ".//supplier/INN")
                or safe_text(contract, ".//ns4:supplierInfo/ns4:INN", NS)
                or ""
            )
            if not winner_name or not winner_inn:
                continue

            # Заказчик
            customer = (
                safe_text(contract, ".//ns4:customer/ns3:shortName", NS)
                or safe_text(contract, ".//customer/shortName")
                or ""
            )
            customer_inn = safe_text(contract, ".//ns4:customer/ns3:INN", NS)

            # Регион
            region = (
                safe_text(contract, ".//ns4:deliveryPlace", NS)
                or safe_text(contract, ".//deliveryPlace")
                or safe_text(contract, ".//ns4:customer/ns3:region/ns3:regionName", NS)
            )

            # ОКПД2
            okpd2 = (
                safe_text(contract, ".//ns4:okpd2/ns3:code", NS)
                or safe_text(contract, ".//okpd2/code")
                or ""
            )

            # Даты
            pub_date = (
                safe_text(contract, ".//ns4:signDate", NS)
                or safe_text(contract, ".//signDate")
                or datetime.datetime.utcnow().isoformat()
            )

            reg_num = (
                safe_text(contract, ".//ns4:regNum", NS)
                or safe_text(contract, ".//regNum")
                or purchase_number
            )

            tender_id = f"eis-{reg_num or purchase_number}"
            source_url = f"https://zakupki.gov.ru/epz/contract/contractCard/common-info.html?reestrNumber={reg_num}"

            tenders.append({
                "tender_id":        tender_id,
                "source":           f"eis_{law_type}",
                "purchase_number":  purchase_number,
                "purchase_type":    "Государственный контракт",
                "law_type":         law_type,
                "customer":         customer,
                "customer_inn":     customer_inn,
                "customer_region":  region,
                "subject":          subject,
                "category":         f"ОКПД2 {okpd2[:2]}" if okpd2 else None,
                "description":      None,
                "quantity":         None,
                "unit":             None,
                "initial_price":    final_price,
                "final_price":      final_price,
                "currency":         "RUB",
                "publication_date": pub_date,
                "end_date":         None,
                "contract_date":    pub_date,
                "delivery_deadline": None,
                "delivery_region":  region,
                "winner":           winner_name,
                "winner_inn":       winner_inn,
                "winner_price":     final_price,
                "winner_rank":      1,
                "source_url":       source_url,
            })

        except Exception as e:
            log.warning(f"Contract parse error: {e}")
            continue

    return tenders

# ── Filter ────────────────────────────────────────────────────────────────────

def is_china_relevant(tender: dict) -> bool:
    """Быстрый фильтр до отправки на AI — экономим кредиты."""
    subject_lc = (tender.get("subject") or "").lower()
    category   = tender.get("category") or ""

    # По ОКПД2
    okpd2_prefix = category.replace("ОКПД2 ", "")[:2]
    if okpd2_prefix in CHINA_FIT_OKPD2:
        return True

    # По ключевым словам в subject
    for kw in CHINA_KEYWORDS:
        if kw in subject_lc:
            return True

    return False

# ── API Client ────────────────────────────────────────────────────────────────

def send_to_chinabridge(tenders: list[dict]) -> dict:
    """POST тендеры на /api/admin/tender-import."""
    headers = {
        "Content-Type": "application/json",
        "X-Admin-Key": API_KEY,
    }
    for attempt in range(3):
        try:
            resp = requests.post(
                API_URL,
                json=tenders,
                headers=headers,
                timeout=120,
            )
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            log.warning(f"API attempt {attempt+1}/3 failed: {e}")
            if attempt < 2:
                time.sleep(10 * (attempt + 1))
    return {"ok": False, "error": "all retries failed"}

# ── Telegram ──────────────────────────────────────────────────────────────────

def tg_report(text: str):
    if not TG_TOKEN:
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage",
            json={"chat_id": TG_CHAT_ID, "text": text, "parse_mode": "HTML"},
            timeout=10,
        )
    except Exception:
        pass

# ── Main ──────────────────────────────────────────────────────────────────────

def run():
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    state = load_state()

    # Берём файлы за последние 2 дня (чтобы не пропускать при сбоях)
    since = datetime.date.today() - datetime.timedelta(days=2)
    processed = set(state.get("processed_files", []))

    total_fetched = total_filtered = total_sent = total_crm = total_hot = 0
    errors = []

    for law_type, ftp_dir in [("44fz", FTP_DIR_44), ("223fz", FTP_DIR_223)]:
        log.info(f"[{law_type}] Listing FTP {ftp_dir}")
        files = list_ftp_files(ftp_dir, since_date=since)
        new_files = [f for f in files if f not in processed]
        log.info(f"[{law_type}] Found {len(files)} files, {len(new_files)} new")

        for fname in new_files:
            gz_path = WORK_DIR / fname
            log.info(f"[{law_type}] Downloading {fname}")

            if not download_ftp_file(ftp_dir, fname, gz_path):
                errors.append(f"download failed: {fname}")
                continue

            tenders = parse_contract_xml(gz_path, law_type)
            total_fetched += len(tenders)

            # Фильтр
            relevant = [t for t in tenders if is_china_relevant(t)]
            total_filtered += len(relevant)
            log.info(f"[{law_type}] {fname}: parsed={len(tenders)}, relevant={len(relevant)}")

            # Батчевая отправка
            for i in range(0, len(relevant), BATCH_SIZE):
                batch = relevant[i:i + BATCH_SIZE]
                result = send_to_chinabridge(batch)
                if result.get("ok"):
                    sent   = result.get("new_saved", 0)
                    crm    = result.get("crm_created", 0)
                    hot    = result.get("hot_found", 0)
                    total_sent += sent
                    total_crm  += crm
                    total_hot  += hot
                    log.info(f"  batch {i//BATCH_SIZE+1}: sent={sent}, crm={crm}, hot={hot}")
                else:
                    log.error(f"  batch failed: {result.get('error')}")
                    errors.append(f"API error: {result.get('error')}")
                time.sleep(2)  # rate limit

            # Удаляем gz после обработки
            gz_path.unlink(missing_ok=True)
            processed.add(fname)

    # Обновляем state
    state["processed_files"] = list(processed)[-500:]  # храним последние 500
    state["last_run"] = datetime.datetime.utcnow().isoformat()
    state["total_sent"] = state.get("total_sent", 0) + total_sent
    save_state(state)

    # Telegram report
    report = (
        f"📊 <b>Tender Collector</b> — {datetime.date.today()}\n\n"
        f"• Файлов обработано: <b>{len([f for f in processed if f not in set(state.get('processed_files_prev', []))])}</b>\n"
        f"• Тендеров спарсено: <b>{total_fetched}</b>\n"
        f"• После фильтра (China-релевантные): <b>{total_filtered}</b>\n"
        f"• Новых сохранено: <b>{total_sent}</b>\n"
        f"• CRM лидов создано: <b>{total_crm}</b>\n"
        f"• 🔥 HOT opportunities: <b>{total_hot}</b>\n"
    )
    if errors:
        report += f"\n⚠️ Ошибки ({len(errors)}):\n" + "\n".join(f"  • {e}" for e in errors[:5])

    log.info(f"Done: fetched={total_fetched}, filtered={total_filtered}, sent={total_sent}, crm={total_crm}, hot={total_hot}")
    tg_report(report)

if __name__ == "__main__":
    run()
