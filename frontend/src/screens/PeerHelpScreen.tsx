import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { capture } from "../services/analytics";
import { useSubjectStore } from "../stores/subjectStore";
import { useUserStore } from "../stores/userStore";
import { getApiErrorMeta } from "../utils/apiError";

type PeerItem = {
  id: string;
  authorId: string;
  subjectId: string;
  problemId: string | null;
  body: string;
  rewardCoins: number;
  status: string;
  helperId: string | null;
  response: string | null;
  createdAt: string;
  author?: { id: string; firstName: string; username?: string | null };
  helper?: { id: string; firstName: string } | null;
  subject?: { code: string; name: string };
};

export function PeerHelpScreen() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const refreshMe = useUserStore((s) => s.refreshMe);
  const { items: subjects, load: loadSubjects } = useSubjectStore();
  const [openItems, setOpenItems] = useState<PeerItem[]>([]);
  const [mine, setMine] = useState<PeerItem[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [completeDrafts, setCompleteDrafts] = useState<Record<string, string>>({});

  async function reload() {
    const q = subjectFilter ? `?subjectId=${encodeURIComponent(subjectFilter)}&take=40` : "?take=40";
    const [o, m] = await Promise.all([
      api.get<{ items: PeerItem[] }>(`/api/peer-help/open${q}`),
      api.get<{ items: PeerItem[] }>("/api/peer-help/mine"),
    ]);
    setOpenItems(o.data.items);
    setMine(m.data.items);
  }

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    capture("screen_view", { screen: "peer_help" });
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const q = subjectFilter ? `?subjectId=${encodeURIComponent(subjectFilter)}&take=40` : "?take=40";
      const [o, m] = await Promise.all([
        api.get<{ items: PeerItem[] }>(`/api/peer-help/open${q}`),
        api.get<{ items: PeerItem[] }>("/api/peer-help/mine"),
      ]);
      if (!cancel) {
        setOpenItems(o.data.items);
        setMine(m.data.items);
      }
    })().catch(() => {});
    return () => {
      cancel = true;
    };
  }, [subjectFilter]);

  async function claim(id: string) {
    setErr(null);
    setBusy(id);
    try {
      await api.post(`/api/peer-help/${encodeURIComponent(id)}/claim`);
      await reload();
      await refreshMe();
      capture("peer_help_claim", { id });
    } catch (e) {
      setErr(getApiErrorMeta(e).message);
    } finally {
      setBusy(null);
    }
  }

  async function complete(id: string) {
    const text = (completeDrafts[id] ?? "").trim();
    setErr(null);
    setBusy(`done:${id}`);
    try {
      await api.post(`/api/peer-help/${encodeURIComponent(id)}/complete`, { response: text });
      setCompleteDrafts((d) => ({ ...d, [id]: "" }));
      await reload();
      await refreshMe();
      capture("peer_help_complete", { id });
    } catch (e) {
      setErr(getApiErrorMeta(e).message);
    } finally {
      setBusy(null);
    }
  }

  async function cancel(id: string) {
    setErr(null);
    setBusy(`cx:${id}`);
    try {
      await api.post(`/api/peer-help/${encodeURIComponent(id)}/cancel`);
      await reload();
      await refreshMe();
      capture("peer_help_cancel", { id });
    } catch (e) {
      setErr(getApiErrorMeta(e).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-4 pb-28">
      <button type="button" className="mb-4 text-sm text-tg-link" onClick={() => navigate(-1)}>
        ← Назад
      </button>
      <h1 className="mb-2 text-xl font-bold text-tg-text">Peer-помощь</h1>
      <p className="mb-4 text-sm text-tg-hint">
        Запросы объяснений за ЕГЭCOIN. Открытый запрос можно взять; после ответа награда переводится помощнику.
      </p>

      {err && (
        <p className="mb-3 rounded-lg border border-red-500/35 bg-red-500/12 p-2 text-sm text-red-800">{err}</p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="text-sm text-tg-hint">
          Предмет:{" "}
          <select
            className="ml-1 rounded-lg border border-tg bg-tg-bg px-2 py-1 text-tg-text"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="">Все</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h2 className="mb-2 text-sm font-semibold text-tg-hint">Открытые</h2>
      <ul className="mb-8 space-y-3">
        {openItems.map((r) => (
          <li key={r.id} className="rounded-2xl border border-tg bg-tg-secondary p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-tg-text">{r.author?.firstName ?? "Ученик"}</p>
                <p className="text-xs text-tg-hint">
                  {r.subject?.name ?? r.subjectId} · {r.rewardCoins} EGC
                </p>
              </div>
              {user?.id !== r.authorId ? (
                <button
                  type="button"
                  disabled={busy === r.id}
                  className="shrink-0 rounded-lg bg-tg-link px-3 py-1.5 text-xs font-medium text-[var(--tg-theme-button-text-color,#fff)] disabled:opacity-50"
                  onClick={() => void claim(r.id)}
                >
                  Взять
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy === `cx:${r.id}`}
                  className="shrink-0 rounded-lg border border-tg px-3 py-1.5 text-xs text-tg-text"
                  onClick={() => void cancel(r.id)}
                >
                  Отменить
                </button>
              )}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-tg-text">{r.body}</p>
          </li>
        ))}
        {!openItems.length ? <p className="text-sm text-tg-hint">Нет открытых запросов.</p> : null}
      </ul>

      <h2 className="mb-2 text-sm font-semibold text-tg-hint">Мои запросы</h2>
      <ul className="space-y-3">
        {mine.map((r) => {
          const isHelper = user?.id === r.helperId;
          const isAuthor = user?.id === r.authorId;
          return (
            <li key={r.id} className="rounded-2xl border border-tg bg-tg-secondary p-4 text-sm">
              <p className="text-xs text-tg-hint">
                {r.status === "open" && "Открыт"}
                {r.status === "claimed" && "В работе"}
                {r.status === "done" && "Закрыт"}
                {r.status === "cancelled" && "Отменён"}
                {" · "}
                {r.rewardCoins} EGC · {r.subject?.name}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-tg-text">{r.body}</p>
              {r.status === "done" && r.response ? (
                <p className="mt-2 border-t border-tg pt-2 text-tg-hint">
                  <span className="font-medium text-tg-text">Ответ: </span>
                  {r.response}
                </p>
              ) : null}
              {r.status === "claimed" && isHelper ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    className="min-h-[100px] w-full rounded-lg border border-tg bg-tg-bg p-2 text-sm text-tg-text placeholder:text-tg-hint"
                    placeholder="Твоё объяснение…"
                    value={completeDrafts[r.id] ?? ""}
                    onChange={(e) => setCompleteDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                  />
                  <button
                    type="button"
                    disabled={busy === `done:${r.id}`}
                    className="w-full rounded-lg bg-tg-link py-2 text-sm font-medium text-[var(--tg-theme-button-text-color,#fff)] disabled:opacity-50"
                    onClick={() => void complete(r.id)}
                  >
                    Отправить ответ и получить EGC
                  </button>
                </div>
              ) : null}
              {r.status === "open" && isAuthor ? (
                <button
                  type="button"
                  className="mt-2 text-xs text-tg-link"
                  onClick={() => void cancel(r.id)}
                  disabled={busy === `cx:${r.id}`}
                >
                  Отменить и вернуть монеты
                </button>
              ) : null}
            </li>
          );
        })}
        {!mine.length ? <p className="text-sm text-tg-hint">Пока пусто.</p> : null}
      </ul>
    </div>
  );
}
