# ВНИМАНИЕ: для монорепо и Coolify используй корневой `Dockerfile` в репозитории (контекст `.`).
# Этот файл — только для локального `docker build ./backend`; миграции лежат в `src/database/prisma/migrations`.
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate && npm run build && npm prune --omit=dev
EXPOSE 3000
ENV NODE_ENV=production
# Миграции на старте; в managed-среде с «Release command» можно вынести в release и оставить только `node dist/server.js`
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
