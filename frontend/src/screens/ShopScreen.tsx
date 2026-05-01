import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useUserStore } from "../stores/userStore";
import { capture } from "../services/analytics";
import { getApiErrorMeta } from "../utils/apiError";

type ShopItem = { id: string; price: number; label: string; category: "help" | "custom" | "premium" };

type TxRow = {
  id: string;
  amount: number;
  type: string;
  createdAt: string;
  meta: unknown;
};

const TAB_LABELS: Record<ShopItem["category"] | "all", string> = {
  all: "Все",
  help: "Помощь",
  custom: "Оформление",
  premium: "Премиум",
};

export function ShopScreen() {
  const navigate = useNavigate();
  const refreshMe = useUserStore((s) => s.refreshMe);
  const balance = useUserStore((s) => s.user?.coinBalance);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [tab, setTab] = useState<"all" | ShopItem["category"] | "history">("all");
  const [tx, setTx] = useState<TxRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    capture("screen_view", { screen: "shop" });
  }, []);

  useEffect(() => {
    void api.get<{ items: ShopItem[] }>("/api/coins/shop").then((r) => setItems(r.data.items));
  }, []);

  useEffect(() => {
    if (tab !== "history") return;
    void api.get<{ items: TxRow[] }>("/api/coins/transactions?take=80").then((r) => setTx(r.data.items));
  }, [tab]);

  const filtered = useMemo(() => {
    if (tab === "all" || tab === "history") return items;
    return items.filter((i) => i.category === tab);
  }, [items, tab]);

  const tabs: Array<typeof tab> = ["all", "help", "custom", "premium", "history"];

  return (
    <div className="p-4 pb-24">
      <button type="button" className="mb-4 text-sm text-tg-link" onClick={() => navigate(-1)}>
        ← Назад
      </button>
      <h1 className="mb-2 text-xl font-bold text-tg-text">Магазин</h1>
      <p className="mb-4 text-amber-600">Баланс: {balance ?? 0} EGC</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded-full px-3 py-1 text-xs ${tab === t ? "bg-tg-link text-[var(--tg-theme-button-text-color,#fff)]" : "bg-tg-hint/20 text-tg-text"}`}
            onClick={() => {
              setErr(null);
              setTab(t);
            }}
          >
            {t === "history" ? "История" : TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {err && (
        <p className="mb-3 rounded-lg border border-red-500/35 bg-red-500/12 p-2 text-sm text-red-800">{err}</p>
      )}

      {tab === "history" ? (
        <ul className="space-y-2">
          {tx.map((row) => (
            <li key={row.id} className="rounded-xl border border-tg bg-tg-secondary p-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-tg-hint">{row.type}</span>
                <span className={row.amount >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
                  {row.amount >= 0 ? "+" : ""}
                  {row.amount}
                </span>
              </div>
              <p className="text-xs text-tg-hint">{new Date(row.createdAt).toLocaleString("ru-RU")}</p>
            </li>
          ))}
          {!tx.length ? <p className="text-sm text-tg-hint">Пока нет операций.</p> : null}
        </ul>
      ) : (
        <ul className="space-y-3">
          {filtered.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 rounded-xl border border-tg bg-tg-secondary p-4">
              <div className="min-w-0">
                <p className="font-medium text-tg-text">{it.label}</p>
                <p className="text-sm text-tg-hint">
                  {it.price} EGC · {TAB_LABELS[it.category]}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg bg-tg-link px-4 py-2 text-sm text-[var(--tg-theme-button-text-color,#fff)]"
                onClick={async () => {
                  setErr(null);
                  try {
                    await api.post("/api/coins/spend", { itemId: it.id });
                    await refreshMe();
                    capture("shop_purchase", { itemId: it.id, price: it.price });
                  } catch (e) {
                    setErr(getApiErrorMeta(e).message);
                  }
                }}
              >
                Купить
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
