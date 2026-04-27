/**
 * Datasource URL читает Prisma из `process.env` напрямую; объект — для явной валидации/логов при старте (по необходимости).
 */
export const databaseConfig = {
  url: process.env.DATABASE_URL,
} as const;
