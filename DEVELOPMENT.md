# ChinaBridge — Development Workflow

## Схема деплоя

```
GitHub branch          Vercel environment
─────────────────────────────────────────
main               →   Production  (chinabridge-weld.vercel.app)
feature/*          →   Preview     (chinabridge-<hash>-china-bridge.vercel.app)
fix/*              →   Preview     (chinabridge-<hash>-china-bridge.vercel.app)
any other branch   →   Preview     (chinabridge-<hash>-china-bridge.vercel.app)
```

Каждый `push` в GitHub **автоматически** запускает Vercel deployment.  
Vercel публикует Preview URL и добавляет комментарий к Pull Request.

---

## Локальная разработка

### Установка зависимостей

```bash
npm install
```

### Запуск dev-сервера

```bash
npm run dev
```

Открой http://localhost:3000

### Сборка (проверка перед пушем)

```bash
npm run build
```

---

## Git workflow

### 1. Создать feature-ветку

```bash
git checkout -b feature/название
```

Примеры:
```bash
git checkout -b feature/add-telegram-bot
git checkout -b feature/update-calculator
git checkout -b fix/footer-mobile-layout
```

### 2. Внести изменения

Редактируй файлы в `components/`, `app/`, `public/` и т.д.

### 3. Проверить сборку локально

```bash
npm run build
```

Убедись, что нет ошибок перед пушем.

### 4. Сделать коммит

```bash
git add .
git commit -m "feat: описание изменений"
```

Примеры сообщений:
```
feat: add telegram bot widget
fix: mobile footer padding
chore: update hero text
```

### 5. Запушить в GitHub

```bash
git push origin feature/название
```

### 6. Получить Preview URL

После `push` Vercel автоматически:
1. Запускает сборку (~30–60 сек)
2. Создаёт уникальный Preview URL вида:  
   `https://chinabridge-<hash>-china-bridge.vercel.app`
3. Если открыт Pull Request — добавляет URL в комментарий к PR

Проверить статус деплоя:
```bash
npx vercel ls --token=<VERCEL_TOKEN>
```

Или в [Vercel Dashboard](https://vercel.com/china-bridge/chinabridge).

### 7. Создать Pull Request

Перейди в [GitHub → Pull Requests](https://github.com/alexprox10-coder/chinabridge/pulls)  
→ нажми **New pull request** → выбери свою ветку → **Create pull request**

Vercel автоматически добавит Preview URL в комментарий к PR.

### 8. Merge в main → Production

После проверки нажми **Merge pull request** на GitHub.  
Vercel автоматически задеплоит в Production.

---

## Структура проекта

```
chinabridge/
├── app/
│   ├── layout.tsx          # Root layout, metadata, fonts
│   ├── page.tsx            # Главная страница
│   ├── icon.tsx            # Favicon (динамический)
│   ├── sitemap.ts          # XML sitemap
│   ├── globals.css         # Глобальные стили
│   ├── contacts/           # Страница контактов
│   └── services/           # Страница услуг
├── components/
│   ├── Header.tsx          # Шапка с навигацией
│   ├── Hero.tsx            # Главный экран + карта маршрута
│   ├── Advantages.tsx      # 4 преимущества
│   ├── Services.tsx        # Услуги (6 карточек)
│   ├── Directions.tsx      # Направления товаров
│   ├── Process.tsx         # Как работаем (6 шагов)
│   ├── Cases.tsx           # Кейсы клиентов
│   ├── Calculator.tsx      # Форма заявки
│   ├── FAQ.tsx             # Частые вопросы
│   └── Footer.tsx          # Подвал
├── public/images/          # Все изображения (PNG/JPG)
├── vercel.json             # Vercel build config
├── next.config.ts          # Next.js config
└── tailwind.config.ts      # Tailwind + цветовые токены
```

---

## Цветовая палитра

| Токен           | Значение  | Использование           |
|-----------------|-----------|-------------------------|
| `background`    | `#0B1F3A` | Основной фон            |
| `accent`        | `#00A86B` | Зелёный акцент          |
| `card`          | `#0f2644` | Фон карточек            |
| `border`        | `#243a5e` | Границы                 |
| `foreground`    | `#FFFFFF` | Основной текст          |
| text muted      | `#8899aa` | Вторичный текст         |

---

## Ссылки

| Ресурс              | URL                                                                 |
|---------------------|---------------------------------------------------------------------|
| Production          | https://chinabridge.pro / chinabridge-weld.vercel.app                |
| Vercel Dashboard    | https://vercel.com/china-bridge/chinabridge                         |
| GitHub Repo         | https://github.com/alexprox10-coder/chinabridge                     |
| GitHub Pull Requests| https://github.com/alexprox10-coder/chinabridge/pulls               |
