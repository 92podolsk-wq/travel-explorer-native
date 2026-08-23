import type { StateCreator } from "zustand";
import type { Area } from "@/entities/area/model/types";
import type { Category } from "@/entities/category/model/types";
import type { Country } from "@/entities/country/model/types";
import type { ExplorationMode } from "@/entities/exploration-mode/model/types";
import type { Poi } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import type { SiteSettings } from "@/entities/site-setting/model/types";
import type { ExplorerState } from "../types";

export type ReferenceDataSlice = Pick<
  ExplorerState,
  "pois" | "regions" | "countries" | "areas" | "explorationModes" | "categories" | "siteSettings" | "setBootstrapData"
>;

export const createReferenceDataSlice: StateCreator<ExplorerState, [], [], ReferenceDataSlice> = (set) => ({
  pois: [],
  regions: [],
  countries: [],
  areas: [],
  explorationModes: [],
  categories: [],
  siteSettings: null,
  setBootstrapData: (data: {
    pois: Poi[];
    regions: Region[];
    countries: Country[];
    areas: Area[];
    explorationModes: ExplorationMode[];
    categories: Category[];
    siteSettings: SiteSettings;
  }) =>
    set((state) => ({
      ...data,
      activeRegionIds:
        state.activeRegionIds.length > 0 && state.activeRegionIds.every((id) => data.regions.some((r) => r.id === id))
          ? state.activeRegionIds
          : data.regions[0]
            ? [data.regions[0].id]
            : [],
      selectedCategories: state.selectedCategories.length > 0 ? state.selectedCategories : data.categories.map((c) => c.id)
    }))
});
