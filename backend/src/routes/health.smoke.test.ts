import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { healthRouter } from "./health";

/** Минимальное приложение без Bull/Prisma — быстрый smoke-тест. */
const app = express();
app.use("/api/health", healthRouter);

describe("GET /api/health", () => {
  it("возвращает status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.time).toBe("string");
  });
});
