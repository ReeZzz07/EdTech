import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import { capture } from "../services/analytics";
import { getApiErrorMeta } from "../utils/apiError";

type ClanRow = { id: string; name: string; description: string; members: number; maxMembers: number };

type GlobalRow = { id: string; name: string; memberCount: number; score: number };

type MineClan = {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  maxMembers: number;
  role: string;
};

type LbUser = {
  user: { id: string; firstName: string; totalProblemsSolved: number; dailyStreak: number; coinBalance: number };
  role: string;
};

type ChatMsg = { id: string; body: string; createdAt: string; user: { id: string; firstName: string } };

export function ClansScreen() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ClanRow[]>([]);
  const [mine, setMine] = useState<MineClan | null>(null);
  const [globalLb, setGlobalLb] = useState<GlobalRow[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [tab, setTab] = useState<"browse" | "chat" | "members">("browse");
  const [membersLb, setMembersLb] = useState<LbUser[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    const [list, me] = await Promise.all([
      api.get<{ items: ClanRow[] }>(`/api/clans?q=${encodeURIComponent(q)}`),
      api.get<{ clan: MineClan | null }>("/api/clans/me"),
    ]);
    setItems(list.data.items);
    setMine(me.data.clan);
  }, [q]);

  const loadGlobal = useCallback(async () => {
    const r = await api.get<{ items: GlobalRow[] }>("/api/clans/leaderboard/global");
    setGlobalLb(r.data.items);
  }, []);

  const loadMembers = useCallback(async () => {
    if (!mine?.id) return;
    const r = await api.get<{ items: LbUser[] }>(`/api/clans/${mine.id}/leaderboard`);
    setMembersLb(r.data.items);
  }, [mine?.id]);

  const loadMessages = useCallback(async () => {
    if (!mine?.id) return;
    const r = await api.get<{ items: ChatMsg[] }>(`/api/clans/${mine.id}/messages`);
    setMessages(r.data.items);
  }, [mine?.id]);

  useEffect(() => {
    capture("screen_view", { screen: "clans" });
  }, []);

  useEffect(() => {
    void loadGlobal();
  }, [loadGlobal]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (mine && tab === "members") void loadMembers();
  }, [mine, tab, loadMembers]);

  useEffect(() => {
    if (!mine || tab !== "chat") return;
    void loadMessages();
    const id = window.setInterval(() => void loadMessages(), 5000);
    return () => window.clearInterval(id);
  }, [mine, tab, loadMessages]);

  async function sendMessage() {
    if (!mine?.id || !draft.trim()) return;
    setErr(null);
    try {
      await api.post(`/api/clans/${mine.id}/messages`, { body: draft.trim() });
      setDraft("");
      await loadMessages();
    } catch (e) {
      setErr(getApiErrorMeta(e).message);
    }
  }

  return (
    <div className="p-4 pb-28">
      <h1 className="mb-4 text-xl font-bold">Кланы</h1>
      {err && <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</p>}

      <section className="mb-6 rounded-2xl border border-black/10 bg-white/90 p-4 dark:bg-zinc-800/80">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Топ кланов</p>
        <p className="mb-3 text-xs text-zinc-500">По сумме решённых задач участников</p>
        <ol className="space-y-2">
          {globalLb.slice(0, 10).map((c, i) => (
            <li key={c.id} className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-200">
                {i + 1}. {c.name}
              </span>
              <span className="text-xs text-zinc-500">
                {c.score} оч. · {c.memberCount} чел.
              </span>
            </li>
          ))}
        </ol>
      </section>

      <input
        className="mb-4 w-full rounded-xl border border-zinc-300 p-3 dark:border-zinc-600 dark:bg-zinc-900"
        placeholder="Поиск клана…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {mine && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Твой клан</p>
          <p className="text-lg font-semibold">{mine.name}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{mine.description}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Роль: {mine.role} · до {mine.maxMembers} участников
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["browse", "members", "chat"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`rounded-full px-3 py-1 text-xs ${tab === t ? "bg-blue-600 text-white" : "bg-white text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"}`}
                onClick={() => setTab(t)}
              >
                {t === "browse" ? "Каталог" : t === "members" ? "Участники" : "Чат"}
              </button>
            ))}
            <button
              type="button"
              className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-800 dark:bg-red-950/60 dark:text-red-200"
              onClick={() => {
                if (!mine?.id) return;
                if (!confirm("Выйти из клана?")) return;
                void (async () => {
                  try {
                    await api.delete(`/api/clans/${mine.id}/leave`);
                    setMine(null);
                    setTab("browse");
                    await loadList();
                    await loadGlobal();
                  } catch (e) {
                    setErr(getApiErrorMeta(e).message);
                  }
                })();
              }}
            >
              Выйти
            </button>
          </div>

          {tab === "members" && (
            <ul className="mt-4 space-y-2 border-t border-blue-200 pt-3 dark:border-blue-900">
              {membersLb.map((row, idx) => (
                <li key={row.user.id} className="flex justify-between text-sm">
                  <span>
                    {idx + 1}. {row.user.firstName}{" "}
                    <span className="text-xs text-zinc-500">{row.role}</span>
                  </span>
                  <span className="text-zinc-600">{row.user.totalProblemsSolved} задач</span>
                </li>
              ))}
            </ul>
          )}

          {tab === "chat" && (
            <div className="mt-4 flex max-h-72 flex-col border-t border-blue-200 pt-3 dark:border-blue-900">
              <div className="mb-2 flex-1 space-y-2 overflow-y-auto">
                {messages.map((m) => (
                  <div key={m.id} className="rounded-lg bg-white/90 p-2 text-sm dark:bg-zinc-900/90">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">{m.user.firstName}</p>
                    <p className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-100">{m.body}</p>
                    <p className="text-[10px] text-zinc-400">{new Date(m.createdAt).toLocaleString("ru-RU")}</p>
                  </div>
                ))}
                {!messages.length ? <p className="text-sm text-zinc-500">Пока нет сообщений — напиши первым.</p> : null}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-zinc-300 p-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                  placeholder="Сообщение…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={2000}
                />
                <button type="button" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white" onClick={() => void sendMessage()}>
                  Отпр.
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(!mine || tab === "browse") && (
        <>
          <ul className="space-y-3">
            {items.map((c) => (
              <li key={c.id} className="rounded-xl border border-black/10 p-4 dark:border-zinc-700">
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">{c.description}</p>
                <p className="mt-2 text-xs text-zinc-400">
                  {c.members}/{c.maxMembers}
                </p>
                {!mine && (
                  <button
                    type="button"
                    className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
                    onClick={async () => {
                      setErr(null);
                      try {
                        await api.post(`/api/clans/${c.id}/join`);
                        await loadList();
                        const me = await api.get<{ clan: MineClan | null }>("/api/clans/me");
                        setMine(me.data.clan);
                      } catch (e) {
                        setErr(getApiErrorMeta(e).message);
                      }
                    }}
                  >
                    Вступить
                  </button>
                )}
              </li>
            ))}
          </ul>

          {!mine && (
            <section className="mt-8 rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-600">
              <p className="mb-2 font-medium">Создать клан</p>
              <input className="mb-2 w-full rounded-lg border p-2 dark:border-zinc-600 dark:bg-zinc-900" placeholder="Название" value={name} onChange={(e) => setName(e.target.value)} />
              <textarea className="mb-2 w-full rounded-lg border p-2 dark:border-zinc-600 dark:bg-zinc-900" placeholder="Описание" value={desc} onChange={(e) => setDesc(e.target.value)} />
              <button
                type="button"
                className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white dark:bg-zinc-200 dark:text-zinc-900"
                onClick={async () => {
                  setErr(null);
                  try {
                    await api.post("/api/clans", { name, description: desc });
                    setName("");
                    setDesc("");
                    await loadList();
                    const me = await api.get<{ clan: MineClan | null }>("/api/clans/me");
                    setMine(me.data.clan);
                  } catch (e) {
                    setErr(getApiErrorMeta(e).message);
                  }
                }}
              >
                Создать
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
