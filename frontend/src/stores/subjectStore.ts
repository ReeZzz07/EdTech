import { create } from "zustand";
import { api } from "../services/api";
import type { SubjectDto } from "../types/api";

type State = {
  items: SubjectDto[];
  selectedId: string | null;
  load: () => Promise<void>;
  select: (id: string | null) => void;
};

export const useSubjectStore = create<State>((set, get) => ({
  items: [],
  selectedId: null,

  select: (id) => set({ selectedId: id }),

  load: async () => {
    const { data } = await api.get<{ items: SubjectDto[] }>("/api/subjects");
    set({ items: data.items });
    const cur = get().selectedId;
    if (!cur && data.items.length) {
      set({ selectedId: data.items[0]!.id });
    }
    if (cur && !data.items.some((s) => s.id === cur)) {
      set({ selectedId: data.items[0]?.id ?? null });
    }
  },
}));
