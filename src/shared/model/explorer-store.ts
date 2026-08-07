import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Area } from "@/entities/area/model/types";
import type { Category } from "@/entities/category/model/types";
import type { Country } from "@/entities/country/model/types";
import type { CustomMarker } from "@/entities/custom-marker/model/types";
import type { ExplorationMode } from "@/entities/exploration-mode/model/types";
import type { Itinerary, ItinerarySummary } from "@/entities/itinerary/model/types";
import type { Poi, PoiMainCategory } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import type { SiteSettings } from "@/entities/site-setting/model/types";
import type { UserPoiState, User } from "@/entities/user/model/types";
import type { Language } from "@/shared/i18n/types";
const DEFAULT_CUSTOM_MARKER_LIMIT = 200;

import {
  toggleFavoriteApi,
  toggleVisitedApi,
  markViewedApi,
  clearFavoritesApi,
  clearVisitedApi,
  clearViewedApi
} from "@/shared/api/poi-actions";

// Ported from the web app's src/shared/model/explorer-store.ts. Phase 2 adds
// the map/filter slice, Phase 3 adds the itinerary slice; custom-marker
// state still waits for Phase 4.
type ExplorerState = {
  // Reference data (populated once from GET /api/bootstrap)
  pois: Poi[];
  regions: Region[];
  countries: Country[];
  areas: Area[];
  explorationModes: ExplorationMode[];
  categories: Category[];
  siteSettings: SiteSettings | null;
  setBootstrapData: (data: {
    pois: Poi[];
    regions: Region[];
    countries: Country[];
    areas: Area[];
    explorationModes: ExplorationMode[];
    categories: Category[];
    siteSettings: SiteSettings;
  }) => void;

  // User favorite/viewed/visited POI ids
  favorites: string[];
  viewedPoiIds: string[];
  visitedPoiIds: string[];
  toggleFavorite: (poiId: string) => void;
  toggleVisited: (poiId: string) => void;
  markPoiViewed: (poiId: string) => void;
  clearFavoritePois: () => void;
  clearVisitedPois: () => void;
  clearViewedPois: () => void;

  // Auth
  currentUser: User | null;
  authStatus: "loading" | "guest" | "authenticated";
  hydrateAuth: (user: User | null, poiState?: UserPoiState) => void;
  setAvatarId: (avatarId: string) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  // Push notifications — pushToken is null until the user grants OS
  // permission and we successfully register a device token with the backend.
  pushToken: string | null;
  setPushToken: (token: string | null) => void;

  // Map/filter state
  activeRegionId: string | null;
  setActiveRegionId: (regionId: string) => void;
  selectedPoiId: string | null;
  setSelectedPoiId: (poiId: string | null) => void;
  selectedCategories: PoiMainCategory[];
  toggleCategory: (category: PoiMainCategory) => void;
  selectAllCategories: () => void;
  clearAllCategories: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  isSwipeOpen: boolean;
  setIsSwipeOpen: (open: boolean) => void;
  isNearbyAlertsEnabled: boolean;
  setNearbyAlertsEnabled: (enabled: boolean) => void;

  // Persisted UI preference
  language: Language;
  setLanguage: (language: Language) => void;
  themeMode: "light" | "dark" | "system";
  setThemeMode: (mode: "light" | "dark" | "system") => void;
  distanceUnit: "km" | "mi";
  setDistanceUnit: (unit: "km" | "mi") => void;

  // Itinerary (Route screen)
  itineraries: ItinerarySummary[];
  activeItineraryId: string | null;
  itinerary: Itinerary | null;
  setItineraries: (itineraries: ItinerarySummary[]) => void;
  setActiveItineraryId: (itineraryId: string | null) => void;
  setItinerary: (itinerary: Itinerary | null) => void;

  // Custom markers (Map screen)
  customMarkers: CustomMarker[];
  customMarkerLimit: number;
  setCustomMarkers: (markers: CustomMarker[], limit: number) => void;
  addCustomMarkerToState: (marker: CustomMarker) => void;
  removeCustomMarkerFromState: (id: string) => void;

  // Offline maps — shared between MapScreen (start a download for the active
  // region) and ProfileScreen (manage/delete downloaded regions).
  downloadedRegionIds: string[];
  downloadingProgress: Record<string, number>;
  setDownloadedRegionIds: (ids: string[]) => void;
  setRegionDownloadProgress: (regionId: string, percent: number | null) => void;
};

export const useExplorerStore = create<ExplorerState>()(
  persist(
    (set, get) => ({
      pois: [],
      regions: [],
      countries: [],
      areas: [],
      explorationModes: [],
      categories: [],
      siteSettings: null,
      setBootstrapData: (data) =>
        set((state) => ({
          ...data,
          activeRegionId: state.activeRegionId ?? data.regions[0]?.id ?? null,
          selectedCategories: state.selectedCategories.length > 0 ? state.selectedCategories : data.categories.map((c) => c.id)
        })),

      favorites: [],
      viewedPoiIds: [],
      visitedPoiIds: [],
      toggleFavorite: (poiId) => {
        set((state) => ({
          favorites: state.favorites.includes(poiId)
            ? state.favorites.filter((id) => id !== poiId)
            : [...state.favorites, poiId]
        }));
        toggleFavoriteApi(poiId).catch(() => {});
      },
      toggleVisited: (poiId) => {
        set((state) => ({
          visitedPoiIds: state.visitedPoiIds.includes(poiId)
            ? state.visitedPoiIds.filter((id) => id !== poiId)
            : [...state.visitedPoiIds, poiId]
        }));
        toggleVisitedApi(poiId).catch(() => {});
      },
      markPoiViewed: (poiId) => {
        if (get().viewedPoiIds.includes(poiId)) return;
        set((state) => ({ viewedPoiIds: [...state.viewedPoiIds, poiId] }));
        markViewedApi(poiId).catch(() => {});
      },
      clearFavoritePois: () => {
        set({ favorites: [] });
        clearFavoritesApi().catch(() => {});
      },
      clearVisitedPois: () => {
        set({ visitedPoiIds: [] });
        clearVisitedApi().catch(() => {});
      },
      clearViewedPois: () => {
        set({ viewedPoiIds: [] });
        clearViewedApi().catch(() => {});
      },

      currentUser: null,
      authStatus: "loading",
      hydrateAuth: (user, poiState) =>
        set({
          currentUser: user,
          authStatus: user ? "authenticated" : "guest",
          ...(user ? { isAuthModalOpen: false } : {}),
          ...(user && poiState
            ? {
                favorites: poiState.favoritePoiIds,
                viewedPoiIds: poiState.viewedPoiIds,
                visitedPoiIds: poiState.visitedPoiIds
              }
            : {})
        }),
      setAvatarId: (avatarId) =>
        set((state) => (state.currentUser ? { currentUser: { ...state.currentUser, avatarId } } : {})),
      pushToken: null,
      setPushToken: (token) => set({ pushToken: token }),
      logout: () =>
        set({
          currentUser: null,
          authStatus: "guest",
          favorites: [],
          viewedPoiIds: [],
          visitedPoiIds: [],
          selectedPoiId: null,
          itinerary: null,
          itineraries: [],
          activeItineraryId: null
        }),
      isAuthModalOpen: false,
      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),

      activeRegionId: null,
      setActiveRegionId: (regionId) => set({ activeRegionId: regionId, selectedPoiId: null }),
      selectedPoiId: null,
      setSelectedPoiId: (poiId) => set({ selectedPoiId: poiId }),
      selectedCategories: [],
      toggleCategory: (category) =>
        set((state) => ({
          selectedCategories: state.selectedCategories.includes(category)
            ? state.selectedCategories.filter((c) => c !== category)
            : [...state.selectedCategories, category]
        })),
      selectAllCategories: () => set({ selectedCategories: get().categories.map((c) => c.id) }),
      clearAllCategories: () => set({ selectedCategories: [] }),
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),
      userLocation: null,
      setUserLocation: (location) => set({ userLocation: location }),
      isSwipeOpen: false,
      setIsSwipeOpen: (open) => set({ isSwipeOpen: open }),
      isNearbyAlertsEnabled: false,
      setNearbyAlertsEnabled: (enabled) => set({ isNearbyAlertsEnabled: enabled }),

      language: "ru",
      setLanguage: (language) => set({ language }),
      themeMode: "system",
      setThemeMode: (mode) => set({ themeMode: mode }),
      distanceUnit: "km",
      setDistanceUnit: (unit) => set({ distanceUnit: unit }),

      itineraries: [],
      activeItineraryId: null,
      itinerary: null,
      setItineraries: (itineraries) => set({ itineraries }),
      customMarkers: [],
      customMarkerLimit: DEFAULT_CUSTOM_MARKER_LIMIT,
      setCustomMarkers: (markers, limit) => set({ customMarkers: markers, customMarkerLimit: limit }),
      addCustomMarkerToState: (marker) => set((state) => ({ customMarkers: [...state.customMarkers, marker] })),
      removeCustomMarkerFromState: (id) =>
        set((state) => ({ customMarkers: state.customMarkers.filter((m) => m.id !== id) })),
      setActiveItineraryId: (itineraryId) => set({ activeItineraryId: itineraryId }),
      setItinerary: (itinerary) => set({ itinerary }),

      downloadedRegionIds: [],
      downloadingProgress: {},
      setDownloadedRegionIds: (ids) => set({ downloadedRegionIds: ids }),
      setRegionDownloadProgress: (regionId, percent) =>
        set((state) => {
          const next = { ...state.downloadingProgress };
          if (percent == null) delete next[regionId];
          else next[regionId] = percent;
          return { downloadingProgress: next };
        })
    }),
    {
      name: "wayora-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        language: state.language,
        activeRegionId: state.activeRegionId,
        pushToken: state.pushToken,
        isNearbyAlertsEnabled: state.isNearbyAlertsEnabled,
        themeMode: state.themeMode,
        distanceUnit: state.distanceUnit
      })
    }
  )
);
