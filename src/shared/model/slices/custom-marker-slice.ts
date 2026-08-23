import type { StateCreator } from "zustand";
import type { CustomMarker } from "@/entities/custom-marker/model/types";
import type { ExplorerState } from "../types";

const DEFAULT_CUSTOM_MARKER_LIMIT = 200;

export type CustomMarkerSlice = Pick<
  ExplorerState,
  "customMarkers" | "customMarkerLimit" | "setCustomMarkers" | "addCustomMarkerToState" | "removeCustomMarkerFromState"
>;

export const createCustomMarkerSlice: StateCreator<ExplorerState, [], [], CustomMarkerSlice> = (set) => ({
  customMarkers: [],
  customMarkerLimit: DEFAULT_CUSTOM_MARKER_LIMIT,
  setCustomMarkers: (markers: CustomMarker[], limit: number) => set({ customMarkers: markers, customMarkerLimit: limit }),
  addCustomMarkerToState: (marker: CustomMarker) => set((state) => ({ customMarkers: [...state.customMarkers, marker] })),
  removeCustomMarkerFromState: (id: string) =>
    set((state) => ({ customMarkers: state.customMarkers.filter((m) => m.id !== id) }))
});
