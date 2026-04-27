import { useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/userStore";
import { capture } from "../services/analytics";
import { useEffect } from "react";

export function ProfileScreen() {
  const { user, logout } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    capture("screen_view", { screen: "profile" });
  }, []);

  return (
    <div className="p-4">
      <h1 className="mb-6 text-xl font-bold">Профиль</h1>
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-800">
          {(user?.firstName?.[0] ?? "?").toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold">{user?.firstName ?? "—"}</p>
          <p className="text-sm text-zinc-500">Уровень {user?.level ?? 1}</p>
        </div>
      </div>
      <ul className="space-y-2">
        <li>
          <button type="button" className="w-full rounded-xl border border-black/10 bg-white p-4 text-left" onClick={() => navigate("/shop")}>
            Магазин ЕГЭCOIN
          </button>
        </li>
        <li>
          <button type="button" className="w-full rounded-xl border border-black/10 bg-white p-4 text-left" onClick={() => navigate("/premium")}>
            Premium
          </button>
        </li>
        <li>
          <button
            type="button"
            className="w-full rounded-xl border border-red-200 bg-red-50 p-4 text-left text-red-800"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Выйти (dev)
          </button>
        </li>
      </ul>
    </div>
  );
}
