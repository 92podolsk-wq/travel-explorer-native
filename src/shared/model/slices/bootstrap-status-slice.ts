import type { StateCreator } from "zustand";
import type { ExplorerState } from "../types";

export type BootstrapStatusSlice = Pick<
  ExplorerState,
  "hasHydrated" | "setHasHydrated" | "isOffline" | "setIsOffline" | "hasPreciseLocation" | "setHasPreciseLocation"
>;

export const createBootstrapStatusSlice: StateCreator<ExplorerState, [], [], BootstrapStatusSlice> = (set) => ({
  hasHydrated: false,
  setHasHydrated: (hydrated: boolean) => set({ hasHydrated: hydrated }),
  isOffline: false,
  setIsOffline: (offline: boolean) => set({ isOffline: offline }),
  hasPreciseLocation: null,
  setHasPreciseLocation: (precise: boolean) => set({ hasPreciseLocation: precise })
});
