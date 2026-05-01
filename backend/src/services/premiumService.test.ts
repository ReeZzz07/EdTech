import { describe, expect, it } from "vitest";
import { userHasActivePremium } from "./premiumService";

describe("userHasActivePremium", () => {
  it("false если не premium", () => {
    expect(userHasActivePremium({ isPremium: false, premiumUntil: null })).toBe(false);
  });

  it("true если premium без даты окончания", () => {
    expect(userHasActivePremium({ isPremium: true, premiumUntil: null })).toBe(true);
  });

  it("false если premium истёк", () => {
    const past = new Date(Date.now() - 86_400_000);
    expect(userHasActivePremium({ isPremium: true, premiumUntil: past })).toBe(false);
  });

  it("true если premium с будущей датой", () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(userHasActivePremium({ isPremium: true, premiumUntil: future })).toBe(true);
  });
});
