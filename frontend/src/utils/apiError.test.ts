import axios from "axios";
import { describe, expect, it } from "vitest";
import { getApiErrorMeta } from "./apiError";

describe("getApiErrorMeta", () => {
  it("читает message и code из тела Axios", () => {
    const err = new axios.AxiosError("fail");
    err.response = {
      status: 429,
      data: { error: { message: "Лимит", code: "daily_limit" } },
    } as never;
    expect(getApiErrorMeta(err)).toEqual({ message: "Лимит", code: "daily_limit" });
  });

  it("fallback по статусу без тела", () => {
    const err = new axios.AxiosError("fail");
    err.response = { status: 502, data: {} } as never;
    expect(getApiErrorMeta(err).message).toContain("502");
  });

  it("Error без axios", () => {
    expect(getApiErrorMeta(new Error("oops"))).toEqual({ message: "oops" });
  });

  it("неизвестное значение", () => {
    expect(getApiErrorMeta(123)).toEqual({ message: "Не удалось выполнить запрос" });
  });
});
