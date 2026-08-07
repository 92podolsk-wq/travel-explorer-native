import { useEffect, useState } from "react";
import { getItinerary, listItineraries } from "@/shared/api/itineraries";
import { useExplorerStore } from "./explorer-store";

// Both the Route screen and the Favorites screen need the active itinerary
// loaded (Route to display it, Favorites to power its "add to itinerary"
// buttons) — whichever screen the user opens first does the one-time fetch,
// the other reuses the already-populated store state.
export function useEnsureItineraryLoaded() {
  const authStatus = useExplorerStore((state) => state.authStatus);
  const itineraries = useExplorerStore((state) => state.itineraries);
  const activeItineraryId = useExplorerStore((state) => state.activeItineraryId);
  const setItineraries = useExplorerStore((state) => state.setItineraries);
  const setActiveItineraryId = useExplorerStore((state) => state.setActiveItineraryId);
  const setItinerary = useExplorerStore((state) => state.setItinerary);

  const [isLoading, setIsLoading] = useState(itineraries.length === 0);

  useEffect(() => {
    if (authStatus !== "authenticated" || itineraries.length > 0) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    listItineraries()
      .then(async (list) => {
        if (cancelled) return;
        setItineraries(list);
        if (list.length > 0) {
          const firstId = activeItineraryId && list.some((i) => i.id === activeItineraryId) ? activeItineraryId : list[0].id;
          setActiveItineraryId(firstId);
          const full = await getItinerary(firstId);
          if (!cancelled) setItinerary(full);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  return { isLoading: authStatus === "loading" || isLoading };
}
