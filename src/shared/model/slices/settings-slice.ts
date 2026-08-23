import type { StateCreator } from "zustand";
import type { Language } from "@/shared/i18n/types";
import type { ExplorerState } from "../types";

export type SettingsSlice = Pick<
  ExplorerState,
  "language" | "setLanguage" | "themeMode" | "setThemeMode" | "distanceUnit" | "setDistanceUnit"
>;

export const createSettingsSlice: StateCreator<ExplorerState, [], [], SettingsSlice> = (set) => ({
  language: "ru",
  setLanguage: (language: Language) => set({ language }),
  themeMode: "system",
  setThemeMode: (mode: "light" | "dark" | "system") => set({ themeMode: mode }),
  distanceUnit: "km",
  setDistanceUnit: (unit: "km" | "mi") => set({ distanceUnit: unit })
});
