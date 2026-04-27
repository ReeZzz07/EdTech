const bucket = process.env.AWS_S3_BUCKET;
const region = process.env.AWS_REGION ?? "us-east-1";
const hasS3 = Boolean(bucket && process.env.AWS_ACCESS_KEY_ID);

export const s3Config = {
  bucket: bucket ?? "",
  region,
  hasS3,
  publicBaseUrl: process.env.AWS_S3_PUBLIC_BASE?.replace(/\/$/, ""),
} as const;

/** Публичный base URL бэка (для /api/files/...) */
export const appPublicConfig = {
  publicUrl: (process.env.APP_PUBLIC_URL ?? "http://127.0.0.1:3000").replace(/\/$/, ""),
} as const;
