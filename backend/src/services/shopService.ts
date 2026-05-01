import { HttpError } from "../utils/httpError";

export type ShopCategory = "help" | "custom" | "premium";

const PRICES: Record<string, { price: number; label: string; category: ShopCategory }> = {
  hint: { price: 50, label: "Подсказка к заданию", category: "help" },
  extra_solution: { price: 80, label: "Доп. разбор", category: "help" },
  theme_aurora: { price: 300, label: "Тема: Aurora", category: "custom" },
  clan_create: { price: 200, label: "Создать клан", category: "premium" },
  premium_month_token: { price: 2000, label: "Premium (упрощ. за токены)", category: "premium" },
};

export function getShopItem(itemId: string) {
  const x = PRICES[itemId];
  if (!x) {
    throw new HttpError("Неизвестный товар", 400, "unknown_item");
  }
  return { id: itemId, ...x };
}

export function listShopItems() {
  return Object.entries(PRICES).map(([id, v]) => ({ id, ...v }));
}
