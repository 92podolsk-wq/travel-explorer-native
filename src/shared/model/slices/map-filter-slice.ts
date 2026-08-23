import type { StateCreator } from "zustand";
import type { PoiMainCategory } from "@/entities/poi/model/types";
import type { ExplorerState } from "../types";

export type MapFilterSlice = Pick<
  ExplorerState,
  | "activeRegionIds"
  | "setActiveRegion"
  | "setActiveCountry"
  | "selectedPoiId"
  | "setSelectedPoiId"
  | "selectedCategories"
  | "toggleCategory"
  | "selectAllCategories"
  | "clearAllCategories"
  | "searchQuery"
  | "setSearchQuery"
  | "userLocation"
  | "setUserLocation"
  | "isSwipeOpen"
  | "setIsSwipeOpen"
  | "isNearbyAlertsEnabled"
  | "setNearbyAlertsEnabled"
>;

export const createMapFilterSlice: StateCreator<ExplorerState, [], [], MapFilterSlice> = (set, get) => ({
  activeRegionIds: [],
  setActiveRegion: (regionId: string) => set({ activeRegionIds: [regionId], selectedPoiId: null }),
  setActiveCountry: (countryId: string) =>
    set((state) => {
      const countryAreaIds = state.areas.filter((area) => area.countryId === countryId).map((area) => area.id);
      const countryRegionIds = state.regions
        .filter((region) => countryAreaIds.includes(region.areaId))
        .map((region) => region.id);
      return {
        activeRegionIds: countryRegionIds.length > 0 ? countryRegionIds : state.activeRegionIds,
        selectedPoiId: null
      };
    }),
  selectedPoiId: null,
  setSelectedPoiId: (poiId: string | null) => set({ selectedPoiId: poiId }),
  selectedCategories: [],
  toggleCategory: (category: PoiMainCategory) =>
    set((state) => ({
      selectedCategories: state.selectedCategories.includes(category)
        ? state.selectedCategories.filter((c) => c !== category)
        : [...state.selectedCategories, category]
    })),
  selectAllCategories: () => set({ selectedCategories: get().categories.map((c) => c.id) }),
  clearAllCategories: () => set({ selectedCategories: [] }),
  searchQuery: "",
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  userLocation: null,
  setUserLocation: (location: { lat: number; lng: number } | null) => set({ userLocation: location }),
  isSwipeOpen: false,
  setIsSwipeOpen: (open: boolean) => set({ isSwipeOpen: open }),
  isNearbyAlertsEnabled: false,
  setNearbyAlertsEnabled: (enabled: boolean) => set({ isNearbyAlertsEnabled: enabled })
});
