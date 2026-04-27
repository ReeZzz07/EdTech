# Деплой backend API в прод

Цель: поднять **Express + Prisma + Bull** рядом с **PostgreSQL** и **Redis**, затем связать фронт на Vercel (`VITE_API_BASE`) и CORS.

## Что нужно в переменных окружения

Ориентир — `backend/.env.example`. В проде обязательно задай как минимум:

| Переменная | Комментарий |
|------------|-------------|
| `DATABASE_URL` | Postgres (часто подставляется платформой из привязанной БД) |
| `REDIS_URL` | Redis для Bull |
| `JWT_SECRET` | Длинная случайная строка |
| `TELEGRAM_BOT_TOKEN` | От [@BotFather](https://t.me/BotFather) для валидации `initData` |
| `CORS_ORIGINS` | Через запятую: локальный dev, `https://web.telegram.org`, **`https://ege-pro.vercel.app`**, кастомный домен фронта при появлении |
| `APP_PUBLIC_URL` | Публичный HTTPS URL **этого API** (без `/` в конце), нужен для локальных файлов/S3-путей по ТЗ |

Опционально: S3 (`AWS_*`), Yandex GPT (`YANDEX_*`), `INTERNAL_COIN_EARN_KEY`.  
`DISABLE_BULL=1` — если нужно временно без очереди (диагноз уйдёт в inline-fallback из кода).

`PORT` обычно задаёт хостинг (Railway/Render); локально по умолчанию `3000`.

## Вариант A: Railway (рекомендуется)

1. [Railway](https://railway.app) → New Project → **Deploy from GitHub** → репозиторий `EdTech`.
2. Добавь плагины **PostgreSQL** и **Redis** в том же проекте.
3. Сервис API:
   - **Root Directory** оставь **пустым** (корень репо), чтобы использовался корневой `Dockerfile`.
   - Либо Root = `backend` и тогда билд через `backend/Dockerfile` (см. комментарий внутри файла).
4. В **Variables** сервиса API:
   - Подтяни `DATABASE_URL` / `REDIS_URL` из плагинов (Reference variable), либо вставь значения вручную.
   - Задай остальные переменные из таблицы выше.
5. Первый деплой: образ сам выполнит `prisma migrate deploy` перед стартом (см. `Dockerfile` в корне).
6. Проверка:
   - `GET https://<твой-api-домен>/api/health` — JSON со `status: ok`.
7. **Сиды** (один раз или после смены данных):
   ```bash
   railway link   # в каталоге репо
   railway run npm run db:seed -w backend
   ```
8. На **Vercel**: Environment → `VITE_API_BASE` = `https://<тот же хост что API>` без слэша в конце → **Redeploy** фронта.

## Вариант B: Docker у себя

Из корня репозитория:

```bash
docker build -t egepro-api .
docker run --env-file backend/.env -p 3000:3000 egepro-api
```

`backend/.env` должен содержать все прод-переменные; `DATABASE_URL` должен быть достижен из контейнера (не `127.0.0.1` хост-машины, если БД не в том же compose).

## После деплоя: связка с фронтом

1. Vercel → `VITE_API_BASE` = URL API.
2. Backend → `CORS_ORIGINS` включает `https://ege-pro.vercel.app`.
3. Быстрая проверка CORS (см. также [README](../README.md)):

```bash
curl -i -X OPTIONS "https://<api-host>/api/health" \
  -H "Origin: https://ege-pro.vercel.app" \
  -H "Access-Control-Request-Method: GET"
```

Должен быть допустимый ответ и заголовок `Access-Control-Allow-Origin` для origin фронта.
