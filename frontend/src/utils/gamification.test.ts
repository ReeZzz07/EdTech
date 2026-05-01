import { describe, expect, it } from "vitest";
import { xpInCurrentLevel } from "./gamification";

describe("xpInCurrentLevel", () => {
  it("при xpPerLevel <= 0 возвращает нули", () => {
    expect(xpInCurrentLevel(500, 0)).toEqual({ current: 0, pct: 0 });
    expect(xpInCurrentLevel(500, -10)).toEqual({ current: 0, pct: 0 });
  });

  it("считает остаток и процент внутри уровня", () => {
    expect(xpInCurrentLevel(1250, 1000)).toEqual({ current: 250, pct: 25 });
  });
});
