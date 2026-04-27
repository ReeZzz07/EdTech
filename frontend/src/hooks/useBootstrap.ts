import { useEffect, useState } from "react";
import { getStoredToken } from "../services/api";
import { initAnalytics, capture } from "../services/analytics";
import { getInitDataRaw, initTelegramUi } from "../services/telegram";
import { useUserStore } from "../stores/userStore";

export function useBootstrap() {
  const [ready, setReady] = useState(false);
  const loginWithInitData = useUserStore((s) => s.loginWithInitData);
  const loginWithDevJwt = useUserStore((s) => s.loginWithDevJwt);
  const refreshMe = useUserStore((s) => s.refreshMe);

  useEffect(() => {
    initTelegramUi();
    initAnalytics();
    capture("session_start");

    const run = async () => {
      try {
        const dev = import.meta.env.VITE_DEV_JWT?.trim();
        if (dev) {
          await loginWithDevJwt(dev);
          return;
        }
        const raw = getInitDataRaw();
        if (raw) {
          await loginWithInitData(raw);
          return;
        }
        if (getStoredToken()) {
          await refreshMe();
        }
      } catch {
        /* остаёмся без user — покажем LoginScreen */
      } finally {
        setReady(true);
      }
    };

    void run();
  }, [loginWithDevJwt, loginWithInitData, refreshMe]);

  return ready;
}
