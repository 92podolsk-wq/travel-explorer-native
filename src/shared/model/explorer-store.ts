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

// Queued when a favorite/visited/viewed mutation's API call fails (e.g. no
// network) — replayed in order once connectivity returns, via
// flushPendingPoiActions. See explorer-store's persist config: while any of
// these are queued, hydrateAuth must not let the server's poiState clobber
// the (ahead-of-server) local favorites/viewed/visited arrays.
type PendingPoiAction = { poiId: string; kind: "toggleFavorite" | "toggleVisited" | "markViewed" };

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
  pendingPoiActions: PendingPoiAction[];
  flushPendingPoiActions: () => Promise<void>;

  // Auth
  currentUser: User | null;
  authStatus: "loading" | "guest" | "authenticated";
  hydrateAuth: (user: User | null, poiState?: UserPoiState) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  // Push notifications — pushToken is null until the user grants OS
  // permission and we successfully register a device token with the backend.
  pushToken: string | null;
  setPushToken: (token: string | null) => void;

  // Map/filter state
  activeRegionIds: string[];
  setActiveRegion: (regionId: string) => void;
  setActiveCountry: (countryId: string) => void;
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

  // Itineraries a friend shared with editor access — kept separate from
  // `itineraries` so they don't count toward the per-user creation limit.
  sharedEditableItineraries: (ItinerarySummary & { ownerName: string })[];
  setSharedEditableItineraries: (itineraries: (ItinerarySummary & { ownerName: string })[]) => void;

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

  // Offline boot support — reference data (pois/regions/.../siteSettings) is
  // persisted so a cold start with no network still has something to show;
  // hasHydrated flips true once that persisted data has been read back from
  // disk, and isOffline flags that we're currently running on that cache
  // rather than a fresh bootstrap response.
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;

  // Android 12+ lets the user grant only "approximate" location even when
  // ACCESS_FINE_LOCATION is requested, which makes fixes coarser and less
  // frequent — surfaced as a hint on the Map screen. null = not checked yet.
  hasPreciseLocation: boolean | null;
  setHasPreciseLocation: (precise: boolean) => void;
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
          activeRegionIds:
            state.activeRegionIds.length > 0 && state.activeRegionIds.every((id) => data.regions.some((r) => r.id === id))
              ? state.activeRegionIds
              : data.regions[0]
                ? [data.regions[0].id]
                : [],
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
        toggleFavoriteApi(poiId).catch(() => {
          set((state) => ({ pendingPoiActions: [...state.pendingPoiActions, { poiId, kind: "toggleFavorite" }] }));
        });
      },
      toggleVisited: (poiId) => {
        set((state) => ({
          visitedPoiIds: state.visitedPoiIds.includes(poiId)
            ? state.visitedPoiIds.filter((id) => id !== poiId)
            : [...state.visitedPoiIds, poiId]
        }));
        toggleVisitedApi(poiId).catch(() => {
          set((state) => ({ pendingPoiActions: [...state.pendingPoiActions, { poiId, kind: "toggleVisited" }] }));
        });
      },
      markPoiViewed: (poiId) => {
        if (get().viewedPoiIds.includes(poiId)) return;
        set((state) => ({ viewedPoiIds: [...state.viewedPoiIds, poiId] }));
        markViewedApi(poiId).catch(() => {
          set((state) => ({ pendingPoiActions: [...state.pendingPoiActions, { poiId, kind: "markViewed" }] }));
        });
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
      pendingPoiActions: [],
      flushPendingPoiActions: async () => {
        const queue = get().pendingPoiActions;
        for (let i = 0; i < queue.length; i++) {
          const item = queue[i];
          try {
            if (item.kind === "toggleFavorite") await toggleFavoriteApi(item.poiId);
            else if (item.kind === "toggleVisited") await toggleVisitedApi(item.poiId);
            else await markViewedApi(item.poiId);
          } catch {
            set({ pendingPoiActions: queue.slice(i) });
            return;
          }
        }
        set({ pendingPoiActions: [] });
      },

      currentUser: null,
      authStatus: "loading",
      hydrateAuth: (user, poiState) =>
        set((state) => ({
          currentUser: user,
          authStatus: user ? "authenticated" : "guest",
          ...(user ? { isAuthModalOpen: false } : {}),
          // Skip while actions are queued — the local arrays are ahead of the
          // server (see pendingPoiActions/flushPendingPoiActions) and would
          // otherwise get clobbered back to the stale server state here.
          ...(user && poiState && state.pendingPoiActions.length === 0
            ? {
                favorites: poiState.favoritePoiIds,
                viewedPoiIds: poiState.viewedPoiIds,
                visitedPoiIds: poiState.visitedPoiIds
              }
            : {})
        })),
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
          activeItineraryId: null,
          sharedEditableItineraries: []
        }),
      isAuthModalOpen: false,
      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),

      activeRegionIds: [],
      setActiveRegion: (regionId) => set({ activeRegionIds: [regionId], selectedPoiId: null }),
      setActiveCountry: (countryId) =>
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
      sharedEditableItineraries: [],
      setSharedEditableItineraries: (itineraries) => set({ sharedEditableItineraries: itineraries }),
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
        }),

      hasHydrated: false,
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      isOffline: false,
      setIsOffline: (offline) => set({ isOffline: offline }),
      hasPreciseLocation: null,
      setHasPreciseLocation: (precise) => set({ hasPreciseLocation: precise })
    }),
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
