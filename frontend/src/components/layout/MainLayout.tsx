import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Camera, Home, Trophy, User, Users } from "lucide-react";
import { haptic } from "../../services/telegram";

const tabs = [
  { to: "/", label: "Главная", icon: Home, end: true },
  { to: "/progress", label: "Прогресс", icon: Trophy },
  { to: "/clans", label: "Кланы", icon: Users },
  { to: "/profile", label: "Профиль", icon: User },
];

export function MainLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const showFab = loc.pathname === "/";

  return (
    <div className="min-h-[100dvh] bg-tg-bg pb-24 text-tg-text">
      <Outlet />
      {showFab && (
        <button
          type="button"
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-tg-link text-[var(--tg-theme-button-text-color,#fff)] shadow-lg active:scale-95"
          onClick={() => {
            haptic("medium");
            navigate("/camera");
          }}
          aria-label="Сфотографировать"
        >
          <Camera size={26} />
        </button>
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-around border-t border-tg bg-tg-secondary pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${isActive ? "font-semibold text-tg-link" : "text-tg-hint"}`
            }
            onClick={() => haptic("light")}
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
