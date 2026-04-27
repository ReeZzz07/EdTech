# ЕГЭ PRO — Telegram Mini App

Monorepo: `backend` (Node.js, Express, Prisma) + `frontend` (Vite/React, см. [roadmap](docs/roadmap.md)).

## Требования

- Node.js 20+
- Docker (PostgreSQL, Redis)

## Быстрый старт

1. `npm install` в корне репозитория.
2. Скопируй `backend/.env.example` в `backend/.env` (по умолчанию совпадает с `docker-compose`).
3. `npm run db:up` — PostgreSQL и Redis.
4. `cd backend && npx prisma migrate deploy` (или `migrate dev`) и `npx prisma db seed`.
5. `npm run dev:backend` — API на `http://127.0.0.1:3000`.
6. `npm run dev:frontend` — UI на `http://localhost:5173` (прокси `/api` на бэкенд). Для локального входа без Telegram задай `VITE_DEV_JWT` в `frontend/.env` (см. `frontend/.env.example`).

## API (кратко)

- `POST /api/auth/telegram` — `{ initData }` → `{ token, user }`
- `GET /api/auth/me` — Bearer
- `GET /api/subjects` — каталог
- `POST /api/problems/upload` — multipart `image` + `subjectId`
- `GET /api/problems/:id/status` | `.../diagnosis` | `POST .../feedback`
- `GET /api/user/progress` | `.../achievements` | `PUT /api/user/settings`
- `GET/POST /api/coins/...` — баланс, shop, spend, earn (с `X-Internal-Key` при `INTERNAL_COIN_EARN_KEY`)
- `GET/POST /api/clans` — кланы, join/leave, leaderboard
- `GET /api/files/:userId/:fileName` — выдача локального файла (тот же `Authorization`)

Переменные: `backend/.env.example`.

## Документация

- [ТЗ](docs/TZ.md)
- [Roadmap](docs/roadmap.md)
- [Правила агента](.cursor/rules.mdc)

## Деплой фронта на Vercel

Репозиторий — **npm workspaces** (корень + `frontend/` + `backend/`). На Vercel поднимается только **статический билд Vite** из `frontend/dist`; API нужно вынести отдельно (Railway, Render, Fly.io, VPS и т.д.) и указать его URL в переменных.

1. В [Vercel](https://vercel.com) — **Import** репозитория, корень проекта оставить **репозиторием целиком** (не менять Root Directory на `frontend`, если используешь корневой `vercel.json`).
2. **Environment Variables** (Production / Preview по желанию):
   - **`VITE_API_BASE`** — для **сборки не обязателен**: в коде подставляется пустая строка, билд пройдёт и без него. Если в Vercel переменная помечена как обязательная — **сними «Required»** или задай значение **пустой строки** (если поле не даёт сохранить пустое — временно удали переменную из списка и задеплой, потом добавь URL бэка). Когда API уже задеплоен — укажи полный URL **без** слэша в конце, например `https://api.example.com` (запросы: `{VITE_API_BASE}/api/...`). Локально с Vite обычно пусто + прокси.
   - По желанию: `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`, для предпросмотра без Telegram в **Preview**: `VITE_DEV_JWT` (только если осознанно нужен dev-логин на стенде).
3. **`CORS_ORIGINS`** на бэкенде (список через запятую) должен включать `https://<project>.vercel.app` и кастомный домен после подключения (см. `backend/.env.example`).

Файл `vercel.json` в корне задаёт install/build/output и SPA-rewrite для React Router.

### Проверка прод API после деплоя

1. На Vercel в Variables выставить `VITE_API_BASE=https://<api-host>` (без `/` в конце) и сделать Redeploy.
2. На бэкенде `CORS_ORIGINS` должен включать `https://ege-pro.vercel.app` (и кастомный домен, если есть).
3. Проверить health API:
   - `curl https://<api-host>/api/health`
4. Проверить CORS (preflight):
   - `curl -i -X OPTIONS https://<api-host>/api/health -H "Origin: https://ege-pro.vercel.app" -H "Access-Control-Request-Method: GET"`
   - ожидание: `HTTP 204/200` и `Access-Control-Allow-Origin: https://ege-pro.vercel.app`.
5. В браузере на `https://ege-pro.vercel.app/login` в DevTools -> Network не должно быть CORS ошибок на запросах к `/api/*`.

## Структура

См. раздел «Структура проекта» в `docs/TZ.md` — дорабатывается по мере этапов roadmap.
