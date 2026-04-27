import { useEffect, useState } from "react";
import { api } from "../services/api";
import { capture } from "../services/analytics";

type ClanRow = { id: string; name: string; description: string; members: number; maxMembers: number };

export function ClansScreen() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ClanRow[]>([]);
  const [mine, setMine] = useState<{ clan: { id: string; name: string } } | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const load = async () => {
    const [list, me] = await Promise.all([
      api.get<{ items: ClanRow[] }>(`/api/clans?q=${encodeURIComponent(q)}`),
      api.get<{ clan: { id: string; name: string } | null }>("/api/clans/me"),
    ]);
    setItems(list.data.items);
    setMine(me.data.clan ? { clan: me.data.clan } : null);
  };

  useEffect(() => {
    capture("screen_view", { screen: "clans" });
  }, []);

  useEffect(() => {
    void load();
  }, [q]);

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">Кланы</h1>
      <input
        className="mb-4 w-full rounded-xl border border-zinc-300 p-3"
        placeholder="Поиск…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {mine && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:bg-blue-950/40">
          <p className="text-sm font-medium">Твой клан</p>
          <p className="text-lg font-semibold">{mine.clan.name}</p>
        </div>
      )}
      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.id} className="rounded-xl border border-black/10 p-4">
            <p className="font-semibold">{c.name}</p>
            <p className="text-sm text-zinc-600">{c.description}</p>
            <p className="mt-2 text-xs text-zinc-400">
              {c.members}/{c.maxMembers}
            </p>
            {!mine && (
              <button
                type="button"
                className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
                onClick={async () => {
                  await api.post(`/api/clans/${c.id}/join`);
                  await load();
                }}
              >
                Вступить
              </button>
            )}
          </li>
        ))}
      </ul>
      {!mine && (
        <section className="mt-8 rounded-xl border border-dashed border-zinc-300 p-4">
          <p className="mb-2 font-medium">Создать клан</p>
          <input className="mb-2 w-full rounded-lg border p-2" placeholder="Название" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea className="mb-2 w-full rounded-lg border p-2" placeholder="Описание" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <button
            type="button"
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white"
            onClick={async () => {
              await api.post("/api/clans", { name, description: desc });
              setName("");
              setDesc("");
              await load();
            }}
          >
            Создать
          </button>
        </section>
      )}
    </div>
  );
}
