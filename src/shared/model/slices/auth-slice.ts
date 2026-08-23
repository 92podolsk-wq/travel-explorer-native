import type { StateCreator } from "zustand";
import type { UserPoiState, User } from "@/entities/user/model/types";
import type { ExplorerState } from "../types";

export type AuthSlice = Pick<
  ExplorerState,
  "currentUser" | "authStatus" | "hydrateAuth" | "logout" | "isAuthModalOpen" | "openAuthModal" | "closeAuthModal" | "pushToken" | "setPushToken"
>;

export const createAuthSlice: StateCreator<ExplorerState, [], [], AuthSlice> = (set) => ({
  currentUser: null,
  authStatus: "loading",
  hydrateAuth: (user: User | null, poiState?: UserPoiState) =>
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
  setPushToken: (token: string | null) => set({ pushToken: token }),
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
  closeAuthModal: () => set({ isAuthModalOpen: false })
});
