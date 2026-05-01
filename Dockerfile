# Production API из корня монорепо (Coolify / Railway / Fly — контекст `.`).
# Сборка: docker build -t egepro-api .
# Старт: Prisma migrate deploy, затем node.
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend ./backend

RUN test -n "$(find backend/prisma/migrations -name migration.sql | head -n1)" \
  || (echo "FATAL: нет SQL миграций в образе (backend/prisma/migrations)" && exit 1)

RUN npm ci --include=dev && npm run db:generate -w backend && npm run build -w backend

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node dist/server.js"]
