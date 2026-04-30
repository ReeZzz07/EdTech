# Полный деплой приложения на Coolify

Цель: развернуть **frontend + backend + PostgreSQL + Redis** целиком на одном VPS через Coolify, с автодеплоем из Git.

## Что должно получиться в итоге

- `https://app.<домен>` -> frontend (Vite SPA)
- `https://api.<домен>` -> backend (Express + Prisma + Bull)
- Postgres и Redis в приватной сети Coolify (без публичных портов)

## 1) Подготовка DNS и доменов

Создай A-записи на IP VPS:

- `app.<домен>` -> `<IP_VPS>`
- `api.<домен>` -> `<IP_VPS>`

Если нужен один домен без `app`, можно использовать `https://<домен>` для фронта и `https://api.<домен>` для API.

## 2) Создай ресурсы в Coolify

В одном project/environment:

1. **PostgreSQL** resource.
2. **Redis** resource.
3. **Backend app** (Dockerfile из Git).
4. **Frontend app** (Dockerfile из Git).

Важно: backend и frontend удобнее делать двумя отдельными приложениями, чтобы независимо деплоить.

## 3) Backend: настройки приложения

### Source

- Repository: твой `EdTech`
- Branch: `master`
- Build Pack: Dockerfile
- Dockerfile path: `Dockerfile`
- Base directory: корень репозитория

Текущий корневой `Dockerfile` уже собирает backend и запускает:

- `npx prisma migrate deploy`
- `node dist/server.js`

### Domain

- Добавь домен: `api.<домен>`
- Включи HTTPS (Let's Encrypt) в Coolify

### Environment variables (backend)

Минимально обязательно:

- `NODE_ENV=production`
- `JWT_SECRET=<длинный_секрет>`
- `TELEGRAM_BOT_TOKEN=<bot_token>`
- `APP_PUBLIC_URL=https://api.<домен>`
- `CORS_ORIGINS=https://app.<домен>,https://web.telegram.org`
- `TRUST_PROXY=1`

Подключение БД/Redis:

- `DATABASE_URL` -> из PostgreSQL resource (через internal hostname/port)
- `REDIS_URL` -> из Redis resource (через internal hostname/port)

Опционально:

- `INTERNAL_COIN_EARN_KEY`
- `AWS_*`
- `YANDEX_*`

Критично:

- `REDIS_URL` не должен быть `127.0.0.1:6379`.
- `TRUST_PROXY` нужен за Traefik, иначе express-rate-limit будет ругаться.

## 4) Frontend: Dockerfile для SPA

Для фронта нужен отдельный Dockerfile со сборкой Vite и раздачей статики через Nginx.

Создай `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend ./frontend

RUN npm ci && npm run build -w frontend

FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Создай `frontend/nginx.conf`:

```nginx
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### Source (frontend app в Coolify)

- Repository: тот же `EdTech`
- Branch: `master`
- Build Pack: Dockerfile
- Dockerfile path: `frontend/Dockerfile`
- Base directory: корень репозитория

### Domain (frontend)

- `app.<домен>` (или корневой домен)
- HTTPS включён

### Environment variables (frontend)

- `VITE_API_BASE=https://api.<домен>`

## 5) Порядок первого деплоя

1. Деплойни PostgreSQL resource.
2. Деплойни Redis resource.
3. Деплойни backend app.
4. Проверь backend health.
5. Деплойни frontend app.

## 6) Проверка после деплоя

### Backend health

```bash
curl https://api.<домен>/api/health
```

Ожидание: `status: ok`.

### CORS

```bash
curl -i -X OPTIONS "https://api.<домен>/api/health" \
  -H "Origin: https://app.<домен>" \
  -H "Access-Control-Request-Method: GET"
```

Ожидание: `Access-Control-Allow-Origin: https://app.<домен>`.

### Prisma migrations

Если логин падает с `P2021` (`public.User does not exist`), проверь:

1. Деплой действительно из свежего коммита.
2. В образ попала папка `backend/src/database/prisma/migrations`.
3. Логи старта backend содержат успешный `prisma migrate deploy`.

Ручная проверка внутри контейнера backend:

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
docker exec <backend_container_name> sh -c "cd /app/backend && npx prisma migrate deploy"
```

## 7) Типовые проблемы и быстрые фиксы

### `ECONNREFUSED 127.0.0.1:6379`

Причина: неверный `REDIS_URL`.
Фикс: поставь internal URL Redis resource из Coolify.

### `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`

Причина: не включён trust proxy.
Фикс: `TRUST_PROXY=1` и redeploy backend.

### `No migration found in prisma/migrations`

Причина: старый образ или неправильный путь миграций.
Фикс: деплой свежего коммита, где миграции лежат в `backend/src/database/prisma/migrations`.

### Контейнер "пропадает"

После redeploy имя контейнера меняется.
Фикс: всегда сначала `docker ps`, потом `docker exec` с актуальным именем.

## 8) Обновления приложения

Обычный цикл:

1. `git push` в `master`.
2. Coolify автодеплой (или manual Deploy).
3. Проверка `/api/health` и ключевого бизнес-сценария (например `/api/auth/telegram`).

## 9) Рекомендации по прод-эксплуатации

- Включи healthcheck/alerts в Coolify.
- Делай бэкапы Postgres (ежедневно + хранение минимум 7 дней).
- Не публикуй наружу порты Postgres/Redis.
- Секреты держи только в Coolify Variables, не в Git.
