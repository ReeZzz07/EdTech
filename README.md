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

## Структура

См. раздел «Структура проекта» в `docs/TZ.md` — дорабатывается по мере этапов roadmap.
