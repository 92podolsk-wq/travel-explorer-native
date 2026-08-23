import type { StateCreator } from "zustand";
import {
  toggleFavoriteApi,
  toggleVisitedApi,
  markViewedApi,
  clearFavoritesApi,
  clearVisitedApi,
  clearViewedApi
} from "@/shared/api/poi-actions";
import type { ExplorerState, PendingPoiAction } from "../types";

export type PoiStateSlice = Pick<
  ExplorerState,
  | "favorites"
  | "viewedPoiIds"
  | "visitedPoiIds"
  | "toggleFavorite"
  | "toggleVisited"
  | "markPoiViewed"
  | "clearFavoritePois"
  | "clearVisitedPois"
  | "clearViewedPois"
  | "pendingPoiActions"
  | "flushPendingPoiActions"
>;

export const createPoiStateSlice: StateCreator<ExplorerState, [], [], PoiStateSlice> = (set, get) => ({
  favorites: [],
  viewedPoiIds: [],
  visitedPoiIds: [],
  toggleFavorite: (poiId: string) => {
    set((state) => ({
      favorites: state.favorites.includes(poiId)
        ? state.favorites.filter((id) => id !== poiId)
        : [...state.favorites, poiId]
    }));
    toggleFavoriteApi(poiId).catch(() => {
      set((state) => ({ pendingPoiActions: [...state.pendingPoiActions, { poiId, kind: "toggleFavorite" } as PendingPoiAction] }));
    });
  },
  toggleVisited: (poiId: string) => {
    set((state) => ({
      visitedPoiIds: state.visitedPoiIds.includes(poiId)
        ? state.visitedPoiIds.filter((id) => id !== poiId)
        : [...state.visitedPoiIds, poiId]
    }));
    toggleVisitedApi(poiId).catch(() => {
      set((state) => ({ pendingPoiActions: [...state.pendingPoiActions, { poiId, kind: "toggleVisited" } as PendingPoiAction] }));
    });
  },
  markPoiViewed: (poiId: string) => {
    if (get().viewedPoiIds.includes(poiId)) return;
    set((state) => ({ viewedPoiIds: [...state.viewedPoiIds, poiId] }));
    markViewedApi(poiId).catch(() => {
      set((state) => ({ pendingPoiActions: [...state.pendingPoiActions, { poiId, kind: "markViewed" } as PendingPoiAction] }));
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
  }
});
