import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useSubjectStore } from "../stores/subjectStore";
import { capture } from "../services/analytics";
import { skillLabelFromSubjectMap } from "../utils/skills";
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

type SkillRow = { skillId: string; avgScore: number; samples: number };

export function ProgressScreen() {
  const navigate = useNavigate();
  const { selectedId, items } = useSubjectStore();
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const [data, setData] = useState<ProgressDto | null>(null);
  const [skills, setSkills] = useState<SkillRow[]>([]);

  useEffect(() => {
    capture("screen_view", { screen: "progress" });
  }, []);

  useEffect(() => {
    const q = new URLSearchParams();
    q.set("period", period);
    if (selectedId) q.set("subjectId", selectedId);
    void api.get<ProgressDto>(`/api/user/progress?${q.toString()}`).then((r) => setData(r.data));
  }, [period, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setSkills([]);
      return;
    }
    void api.get<{ items: SkillRow[] }>(`/api/user/skill-summary?subjectId=${encodeURIComponent(selectedId)}`).then((r) => setSkills(r.data.items));
  }, [selectedId]);

  const subj = items.find((s) => s.id === selectedId);
  const skillMap = subj?.skillMap;

  return (
    <div className="p-4 pb-28">
      <h1 className="mb-4 text-xl font-bold text-tg-text">Прогресс</h1>
      <div className="mb-4 flex gap-2">
        {(["week", "month", "all"] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={`rounded-full px-3 py-1 text-sm ${period === p ? "bg-tg-link text-[var(--tg-theme-button-text-color,#fff)]" : "bg-tg-hint/20 text-tg-text"}`}
            onClick={() => setPeriod(p)}
          >
            {p === "week" ? "Неделя" : p === "month" ? "Месяц" : "Всё"}
          </button>
        ))}
      </div>
      <p className="mb-2 text-sm text-tg-hint">Предмет: {subj?.name ?? "—"}</p>

      {skills.length > 0 && (
        <section className="mb-6 rounded-2xl border border-tg bg-tg-secondary p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-tg-text">Карта навыков (среднее по разборам)</p>
            <button type="button" className="text-xs text-tg-link" onClick={() => navigate("/premium")}>
              Premium → полный разбор
            </button>
          </div>
          <ul className="space-y-3">
            {skills.map((s) => {
              const label = skillLabelFromSubjectMap(skillMap, s.skillId);
              const w = Math.min(100, Math.max(0, s.avgScore));
              return (
                <li key={s.skillId}>
                  <div className="mb-1 flex justify-between text-xs text-tg-hint">
                    <span>{label}</span>
                    <span>
                      {s.avgScore}% · n={s.samples}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-tg-hint/25">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${w}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {data && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl border border-tg bg-tg-secondary p-3">
              <p className="text-tg-hint">Решено</p>
              <p className="text-lg font-semibold text-tg-text">{data.totals.solved}</p>
            </div>
            <div className="rounded-xl border border-tg bg-tg-secondary p-3">
              <p className="text-tg-hint">Серия</p>
              <p className="text-lg font-semibold text-tg-text">{data.totals.streak} дн.</p>
            </div>
            <div className="rounded-xl border border-tg bg-tg-secondary p-3">
              <p className="text-tg-hint">Уровень</p>
              <p className="text-lg font-semibold text-tg-text">{data.totals.level}</p>
            </div>
            <div className="rounded-xl border border-tg bg-tg-secondary p-3">
              <p className="text-tg-hint">XP</p>
              <p className="text-lg font-semibold text-tg-text">{data.totals.experience}</p>
            </div>
          </div>
          <div className="h-56 w-full rounded-xl border border-tg bg-tg-secondary p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.solvedByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--tg-theme-hint-color, #999)" strokeOpacity={0.35} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--tg-theme-hint-color, #888)" }} />
                <YAxis allowDecimals={false} width={24} tick={{ fontSize: 10, fill: "var(--tg-theme-hint-color, #888)" }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--tg-theme-link-color, #2563eb)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
