#!/bin/bash
# Установка Tender Intelligence Collector на Beget VPS (Ubuntu 24.04)
# Запуск: bash install.sh

set -e

echo "=== Tender Intelligence Collector Setup ==="

# Создаём директорию
mkdir -p /opt/collector/data
cd /opt/collector

# Python venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install requests

# Копируем скрипт
cp /tmp/eis_collector.py /opt/collector/eis_collector.py
chmod +x /opt/collector/eis_collector.py

# .env файл
cat > /opt/collector/.env << 'ENVEOF'
CHINABRIDGE_API=https://chinabridge.pro/api/admin/tender-import
ADMIN_KEY=REPLACE_WITH_CRON_SECRET
TG_BOT_TOKEN=REPLACE_WITH_BOT_TOKEN
TG_CHAT_ID=8979087725
ENVEOF

# Wrapper script с загрузкой .env
cat > /opt/collector/run.sh << 'EOF'
#!/bin/bash
set -a
source /opt/collector/.env
set +a
/opt/collector/venv/bin/python3 /opt/collector/eis_collector.py >> /opt/collector/collector.log 2>&1
EOF
chmod +x /opt/collector/run.sh

# Cron — каждые 4 часа
(crontab -l 2>/dev/null; echo "0 */4 * * * /opt/collector/run.sh") | crontab -

echo ""
echo "=== Готово ==="
echo ""
echo "1. Отредактируй /opt/collector/.env — вставь ADMIN_KEY (= CRON_SECRET из Vercel)"
echo "2. Тестовый запуск: /opt/collector/run.sh"
echo "3. Проверь логи: tail -f /opt/collector/collector.log"
echo ""
echo "Cron активен: каждые 4 часа"
crontab -l
