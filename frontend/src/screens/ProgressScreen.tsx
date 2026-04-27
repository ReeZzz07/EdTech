import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useSubjectStore } from "../stores/subjectStore";
import { capture } from "../services/analytics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ProgressDto = {
  period: string;
  subjectId: string | null;
  solvedByDay: { day: string; count: number }[];
  totals: { solved: number; streak: number; level: number; experience: number };
};

export function ProgressScreen() {
  const { selectedId, items } = useSubjectStore();
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const [data, setData] = useState<ProgressDto | null>(null);

  useEffect(() => {
    capture("screen_view", { screen: "progress" });
  }, []);

  useEffect(() => {
    const q = new URLSearchParams();
    q.set("period", period);
    if (selectedId) q.set("subjectId", selectedId);
    void api.get<ProgressDto>(`/api/user/progress?${q.toString()}`).then((r) => setData(r.data));
  }, [period, selectedId]);

  const subj = items.find((s) => s.id === selectedId);

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">Прогресс</h1>
      <div className="mb-4 flex gap-2">
        {(["week", "month", "all"] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={`rounded-full px-3 py-1 text-sm ${period === p ? "bg-blue-600 text-white" : "bg-zinc-200 text-zinc-700"}`}
            onClick={() => setPeriod(p)}
          >
            {p === "week" ? "Неделя" : p === "month" ? "Месяц" : "Всё"}
          </button>
        ))}
      </div>
      <p className="mb-2 text-sm text-zinc-500">Предмет: {subj?.name ?? "—"}</p>
      {data && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl border border-black/10 p-3">
              <p className="text-zinc-500">Решено</p>
              <p className="text-lg font-semibold">{data.totals.solved}</p>
            </div>
            <div className="rounded-xl border border-black/10 p-3">
              <p className="text-zinc-500">Серия</p>
              <p className="text-lg font-semibold">{data.totals.streak} дн.</p>
            </div>
            <div className="rounded-xl border border-black/10 p-3">
              <p className="text-zinc-500">Уровень</p>
              <p className="text-lg font-semibold">{data.totals.level}</p>
            </div>
            <div className="rounded-xl border border-black/10 p-3">
              <p className="text-zinc-500">XP</p>
              <p className="text-lg font-semibold">{data.totals.experience}</p>
            </div>
          </div>
          <div className="h-56 w-full rounded-xl border border-black/10 bg-white p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.solvedByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} width={24} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
