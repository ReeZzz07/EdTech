import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { appPublicConfig, s3Config } from "../config/s3";

const uploadRoot = path.join(process.cwd(), "uploads");

function contentTypeForExt(ext: string) {
  const e = ext.toLowerCase();
  if (e === "png") return "image/png";
  if (e === "webp") return "image/webp";
  return "image/jpeg";
}

export async function readImageBufferForProblem(imageKey: string) {
  if (s3Config.hasS3) {
    const { GetObjectCommand, S3Client: C } = await import("@aws-sdk/client-s3");
    const client = new C({ region: s3Config.region });
    const out = await client.send(
      new GetObjectCommand({ Bucket: s3Config.bucket, Key: imageKey }),
    );
    const bytes = await out.Body?.transformToByteArray();
    if (!bytes) throw new Error("empty s3 object");
    return Buffer.from(bytes);
  }
  const full = path.join(uploadRoot, imageKey);
  return fs.readFile(full);
}

/**
 * @param fileExt без точки, напр. `jpg`
 */
export async function saveProblemImage(
  userId: string,
  buffer: Buffer,
  fileExt: string,
): Promise<{ imageKey: string; imageUrl: string }> {
  const ext = fileExt.replace(/^\./, "") || "jpg";
  const name = `${randomUUID()}.${ext}`;
  const rel = `${userId}/${name}`;

  if (s3Config.hasS3) {
    const client = new S3Client({ region: s3Config.region });
    await client.send(
      new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: rel,
        Body: buffer,
        ContentType: contentTypeForExt(ext),
      }),
    );
    const url = s3Config.publicBaseUrl
      ? `${s3Config.publicBaseUrl}/${rel}`
      : `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${rel}`;
    return { imageKey: rel, imageUrl: url };
  }

  await fs.mkdir(path.join(uploadRoot, userId), { recursive: true });
  await fs.writeFile(path.join(uploadRoot, userId, name), buffer);
  return { imageKey: rel, imageUrl: urlForLocal(rel) };
}

export function localFileAbsolute(imageKey: string) {
  return path.join(uploadRoot, imageKey);
}

export function urlForLocal(imageKey: string) {
  const parts = imageKey.split("/");
  if (parts.length < 2) {
    return `${appPublicConfig.publicUrl}/api/files/`;
  }
  const [uid, n] = parts;
  return `${appPublicConfig.publicUrl}/api/files/${uid}/${n}`;
}
