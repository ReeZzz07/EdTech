# Production API из корня монорепо (Railway / Fly.io с контекстом `.`).
# Сборка: docker build -t egepro-api .
# Старт: Prisma migrate deploy, затем node.
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend ./backend

RUN test -n "$(find backend/src/database/prisma/migrations -name migration.sql | head -n1)" \
  || (echo "FATAL: нет SQL миграций в образе (путь backend/src/database/prisma/migrations)" && exit 1)

# Prisma CLI при schema в подкаталоге всё равно ищет историю в backend/prisma/migrations относительно package.json.
RUN mkdir -p backend/prisma \
  && ln -sfn ../src/database/prisma/migrations backend/prisma/migrations \
  && test -f backend/prisma/migrations/migration_lock.toml

RUN npm ci --include=dev && npm run db:generate -w backend && npm run build -w backend

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "cd backend && npx prisma migrate deploy --schema=src/database/schema.prisma && node dist/server.js"]
