import { create } from "zustand";
import { api, getStoredToken, setAuthToken } from "../services/api";
import type { UserDto } from "../types/api";

type State = {
  user: UserDto | null;
  loading: boolean;
  error: string | null;
  loginWithInitData: (initData: string) => Promise<void>;
  loginWithDevJwt: (jwt: string) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => void;
  patchLocalUser: (partial: Partial<UserDto>) => void;
};

export const useUserStore = create<State>((set, get) => ({
  user: null,
  loading: false,
  error: null,

  patchLocalUser: (partial) => {
    const u = get().user;
    if (u) set({ user: { ...u, ...partial } });
  },

  logout: () => {
    setAuthToken(null);
    set({ user: null });
  },

  loginWithDevJwt: async (jwt) => {
    set({ loading: true, error: null });
    try {
      setAuthToken(jwt);
      await get().refreshMe();
    } catch (e) {
      setAuthToken(null);
      const msg = e instanceof Error ? e.message : "auth failed";
      set({ error: msg, user: null });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  loginWithInitData: async (initData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post<{ token: string; user: UserDto }>("/api/auth/telegram", { initData });
      setAuthToken(data.token);
      set({ user: data.user });
    } catch (e) {
      setAuthToken(null);
      const msg = e instanceof Error ? e.message : "auth failed";
      set({ error: msg, user: null });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  refreshMe: async () => {
    const t = getStoredToken();
    if (!t) {
      set({ user: null });
      return;
    }
    const { data } = await api.get<{ user: UserDto }>("/api/auth/me");
    set({ user: data.user });
  },
}));
