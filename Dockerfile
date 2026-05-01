# Production API из корня монорепо (Railway / Fly.io с контекстом `.`).
# Сборка: docker build -t egepro-api .
# Старт: Prisma migrate deploy, затем node.
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend ./backend

RUN test -n "$(find backend/src/database/prisma/migrations -name migration.sql | head -n1)" \
  || (echo "FATAL: нет SQL миграций в образе (путь backend/src/database/prisma/migrations)" && exit 1)

# Prisma migrate при schema в src/database отображает «prisma/migrations», но резолвит каталог относительно package.json backend → нужен backend/prisma/migrations (реальные файлы, не symlink — иначе CLI может не подхватить).
RUN rm -rf backend/prisma/migrations \
  && mkdir -p backend/prisma/migrations \
  && cp -a backend/src/database/prisma/migrations/. backend/prisma/migrations/ \
  && test -f backend/prisma/migrations/migration_lock.toml \
  && test -n "$(find backend/prisma/migrations -name migration.sql | head -n1)"

RUN npm ci --include=dev && npm run db:generate -w backend && npm run build -w backend

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "cd backend && npx prisma migrate deploy --schema=src/database/schema.prisma && node dist/server.js"]
