import { HttpError } from "../utils/httpError";

const PRICES: Record<string, { price: number; label: string }> = {
  hint: { price: 50, label: "Подсказка к заданию" },
  extra_solution: { price: 80, label: "Доп. разбор" },
  theme_aurora: { price: 300, label: "Тема: Aurora" },
  clan_create: { price: 200, label: "Создать клан" },
  premium_month_token: { price: 2000, label: "Premium (упрощ. за токены)" },
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
