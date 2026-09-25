import { useCallback, useEffect, useRef } from "react";
import { getItinerary } from "@/shared/api/itineraries";
import type { Itinerary } from "@/entities/itinerary/model/types";

// getItinerary responses can land out of order relative to which itinerary
// is actually active — the user can switch trips (or a background refresh
// can fire) while an earlier request for a *different* trip is still in
// flight. A plain closure over activeItineraryId would only ever see the id
// that was current when the request was made, so it can't tell a stale
// response apart from a fresh one; a ref tracks the *latest* id instead.
export function useActiveItinerarySync(
  activeItineraryId: string | null,
  setItinerary: (itinerary: Itinerary | null) => void
) {
  const activeItineraryIdRef = useRef(activeItineraryId);
  useEffect(() => {
    activeItineraryIdRef.current = activeItineraryId;
  }, [activeItineraryId]);

  const applyIfStillActive = useCallback(
    (id: string, itinerary: Itinerary) => {
      if (activeItineraryIdRef.current === id) setItinerary(itinerary);
    },
    [setItinerary]
  );

  // Companions co-editing the same shared itinerary see each other's changes
  // via useItineraryRealtime's WebSocket almost instantly; its focus-refetch
  // + slow poll is just the fallback for whenever the socket is down (e.g.
  // briefly backgrounded on mobile), so the trip still stays in sync
  // without a manual restart.
  const refreshItinerary = useCallback(() => {
    if (!activeItineraryId) return;
    const requestedId = activeItineraryId;
    getItinerary(requestedId)
      .then((full) => applyIfStillActive(requestedId, full))
      .catch(() => {});
  }, [activeItineraryId, applyIfStillActive]);

  // Fetches itinerary `id` and applies it only if it's still the active one
  // by the time the response arrives — for callers (like switching trips)
  // that already know which id they're asking for.
  const fetchItineraryIfStillActive = useCallback(
    async (id: string) => {
      const full = await getItinerary(id);
      applyIfStillActive(id, full);
    },
    [applyIfStillActive]
  );

  return { refreshItinerary, fetchItineraryIfStillActive };
}
