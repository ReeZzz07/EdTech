# Сборка из каталога backend: `docker build -t egepro-api ./backend`
# (lockfile у npm workspaces в корне репо — здесь `npm install` фиксирует зависимости по package.json)
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
RUN npx prisma generate && npm run build && npm prune --omit=dev
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/server.js"]
