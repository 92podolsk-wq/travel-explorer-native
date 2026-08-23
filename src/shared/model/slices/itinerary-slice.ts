import type { StateCreator } from "zustand";
import type { Itinerary, ItinerarySummary } from "@/entities/itinerary/model/types";
import type { ExplorerState } from "../types";

export type ItinerarySlice = Pick<
  ExplorerState,
  | "itineraries"
  | "activeItineraryId"
  | "itinerary"
  | "setItineraries"
  | "setActiveItineraryId"
  | "setItinerary"
  | "sharedEditableItineraries"
  | "setSharedEditableItineraries"
>;

export const createItinerarySlice: StateCreator<ExplorerState, [], [], ItinerarySlice> = (set) => ({
  itineraries: [],
  activeItineraryId: null,
  itinerary: null,
  setItineraries: (itineraries: ItinerarySummary[]) => set({ itineraries }),
  setActiveItineraryId: (itineraryId: string | null) => set({ activeItineraryId: itineraryId }),
  setItinerary: (itinerary: Itinerary | null) => set({ itinerary }),
  sharedEditableItineraries: [],
  setSharedEditableItineraries: (itineraries: (ItinerarySummary & { ownerName: string })[]) =>
    set({ sharedEditableItineraries: itineraries })
});
