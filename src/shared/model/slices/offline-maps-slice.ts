import type { StateCreator } from "zustand";
import type { ExplorerState } from "../types";

export type OfflineMapsSlice = Pick<
  ExplorerState,
  "downloadedRegionIds" | "downloadingProgress" | "setDownloadedRegionIds" | "setRegionDownloadProgress"
>;

export const createOfflineMapsSlice: StateCreator<ExplorerState, [], [], OfflineMapsSlice> = (set) => ({
  downloadedRegionIds: [],
  downloadingProgress: {},
  setDownloadedRegionIds: (ids: string[]) => set({ downloadedRegionIds: ids }),
  setRegionDownloadProgress: (regionId: string, percent: number | null) =>
    set((state) => {
      const next = { ...state.downloadingProgress };
      if (percent == null) delete next[regionId];
      else next[regionId] = percent;
      return { downloadingProgress: next };
    })
});
