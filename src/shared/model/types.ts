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

// Queued when a favorite/visited/viewed mutation's API call fails (e.g. no
// network) — replayed in order once connectivity returns, via
// flushPendingPoiActions. See explorer-store's persist config: while any of
// these are queued, hydrateAuth must not let the server's poiState clobber
// the (ahead-of-server) local favorites/viewed/visited arrays.
export type PendingPoiAction = { poiId: string; kind: "toggleFavorite" | "toggleVisited" | "markViewed" };

// Ported from the web app's src/shared/model/explorer-store.ts. Phase 2 adds
// the map/filter slice, Phase 3 adds the itinerary slice; custom-marker
// state still waits for Phase 4.
//
// Split across src/shared/model/slices/* (one file per domain) and combined
// in explorer-store.ts via the Zustand slices pattern — this type is the
// single source of truth for the combined shape all slices are typed
// against, so every slice can read/write fields owned by another slice
// (e.g. hydrateAuth touching poi-state fields) without circular imports.
export type ExplorerState = {
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
