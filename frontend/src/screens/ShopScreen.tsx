import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useUserStore } from "../stores/userStore";

type Item = { id: string; price: number; label: string };

export function ShopScreen() {
  const navigate = useNavigate();
  const refreshMe = useUserStore((s) => s.refreshMe);
  const balance = useUserStore((s) => s.user?.coinBalance);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    void api.get<{ items: Item[] }>("/api/coins/shop").then((r) => setItems(r.data.items));
  }, []);

  return (
    <div className="p-4 pb-24">
      <button type="button" className="mb-4 text-sm text-blue-600" onClick={() => navigate(-1)}>
        ← Назад
      </button>
      <h1 className="mb-2 text-xl font-bold">Магазин</h1>
      <p className="mb-6 text-amber-600">Баланс: {balance ?? 0} EGC</p>
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between rounded-xl border border-black/10 p-4">
            <div>
              <p className="font-medium">{it.label}</p>
              <p className="text-sm text-zinc-500">{it.price} EGC</p>
            </div>
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
              onClick={async () => {
                await api.post("/api/coins/spend", { itemId: it.id });
                await refreshMe();
              }}
            >
              Купить
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
