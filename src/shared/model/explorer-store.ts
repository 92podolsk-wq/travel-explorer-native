import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createExplorerState } from "./create-explorer-state";
import type { ExplorerState } from "./types";

export const useExplorerStore = create<ExplorerState>()(
  persist(
    createExplorerState,
    {
      name: "wayora-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        language: state.language,
        activeRegionIds: state.activeRegionIds,
        // Not persisting this would leave it [] on a cold offline start
        // (setBootstrapData, which backfills "all categories" when empty,
        // never runs offline) — every POI would then fail the
        // selectedCategories.includes() filter in MapScreen's visiblePois.
        selectedCategories: state.selectedCategories,
        pushToken: state.pushToken,
        isNearbyAlertsEnabled: state.isNearbyAlertsEnabled,
        themeMode: state.themeMode,
        distanceUnit: state.distanceUnit,
        // Reference data cached for offline cold-starts — see hasHydrated.
        pois: state.pois,
        regions: state.regions,
        countries: state.countries,
        areas: state.areas,
        categories: state.categories,
        siteSettings: state.siteSettings,
        // Personal POI state cached for offline cold-starts, plus the queue
        // of mutations that haven't reached the server yet (see hydrateAuth).
        favorites: state.favorites,
        viewedPoiIds: state.viewedPoiIds,
        visitedPoiIds: state.visitedPoiIds,
        pendingPoiActions: state.pendingPoiActions
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);

// Resolves once persisted state has been read back from AsyncStorage, so
// callers can reliably tell "no cached data" apart from "cache not read yet".
export function waitForStoreHydration(): Promise<void> {
  if (useExplorerStore.getState().hasHydrated) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = useExplorerStore.subscribe((state) => {
      if (state.hasHydrated) {
        unsubscribe();
        resolve();
      }
    });
  });
}
