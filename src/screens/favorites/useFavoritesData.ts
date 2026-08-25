import { useMemo } from "react";
import { stopPointId } from "@/entities/itinerary/model/stop-point";
import { addItineraryStop, removeItineraryStop } from "@/shared/api/itineraries";
import { useExplorerStore } from "@/shared/model/explorer-store";

const HOURS_PER_DAY = 6;

// Derived favorites/history data plus the itinerary-mutation handlers the
// saved-places tab needs — kept together since they all read from the same
// favorites/itinerary/region slices and would otherwise be threaded through
// several near-identical selector calls.
export function useFavoritesData() {
  const authStatus = useExplorerStore((state) => state.authStatus);
  const openAuthModal = useExplorerStore((state) => state.openAuthModal);
  const pois = useExplorerStore((state) => state.pois);
  const regions = useExplorerStore((state) => state.regions);
  const language = useExplorerStore((state) => state.language);
  const favorites = useExplorerStore((state) => state.favorites);
  const viewedPoiIds = useExplorerStore((state) => state.viewedPoiIds);
  const visitedPoiIds = useExplorerStore((state) => state.visitedPoiIds);
  const itinerary = useExplorerStore((state) => state.itinerary);
  const setItinerary = useExplorerStore((state) => state.setItinerary);

  const regionNameById = useMemo(
    () => new Map(regions.map((r) => [r.id, r.nameByLanguage[language] ?? r.name])),
    [regions, language]
  );
  const favoritePois = useMemo(() => pois.filter((p) => favorites.includes(p.id)), [pois, favorites]);
  const viewedPois = useMemo(() => pois.filter((p) => viewedPoiIds.includes(p.id)), [pois, viewedPoiIds]);
  const visitedPois = useMemo(() => pois.filter((p) => visitedPoiIds.includes(p.id)), [pois, visitedPoiIds]);

  const itineraryPoiIds = useMemo(() => new Set((itinerary?.stops ?? []).map((s) => stopPointId(s.point))), [itinerary]);

  const favoritesByRegion = useMemo(
    () =>
      regions
        .map((region) => ({ region, pois: favoritePois.filter((p) => p.regionId === region.id) }))
        .filter((group) => group.pois.length > 0),
    [regions, favoritePois]
  );

  const favoritesRegionProgress = useMemo(
    () =>
      favoritesByRegion.map(({ region, pois: regionPois }) => {
        const totalInRegion = pois.filter((p) => p.regionId === region.id).length;
        const percent = totalInRegion > 0 ? Math.round((regionPois.length / totalInRegion) * 100) : 0;
        return { region, count: regionPois.length, percent };
      }),
    [favoritesByRegion, pois]
  );

  const tripDays = useMemo(() => {
    if (favoritePois.length === 0) return 0;
    const totalMinutes = favoritePois.reduce((sum, p) => sum + p.durationMinutes, 0);
    return Math.max(1, Math.ceil(totalMinutes / (HOURS_PER_DAY * 60)));
  }, [favoritePois]);

  async function handleAddToItinerary(poiId: string) {
    if (authStatus === "guest") {
      openAuthModal();
      return;
    }
    if (!itinerary) return;
    setItinerary(await addItineraryStop(itinerary.id, { poiId }));
  }

  async function handleRemoveFromItinerary(poiId: string) {
    if (!itinerary) return;
    const stop = itinerary.stops.find((s) => stopPointId(s.point) === poiId);
    if (!stop) return;
    setItinerary(await removeItineraryStop(itinerary.id, stop.id));
  }

  async function handleAddAllToItinerary() {
    if (authStatus === "guest") {
      openAuthModal();
      return;
    }
    if (!itinerary) return;
    const poiIds = favoritePois.filter((p) => !itineraryPoiIds.has(p.id)).map((p) => p.id);
    if (poiIds.length === 0) return;
    setItinerary(await addItineraryStop(itinerary.id, { poiIds }));
  }

  async function handleAddRegionToItinerary(regionId: string) {
    if (authStatus === "guest") {
      openAuthModal();
      return;
    }
    if (!itinerary) return;
    const poiIds = favoritePois.filter((p) => p.regionId === regionId && !itineraryPoiIds.has(p.id)).map((p) => p.id);
    if (poiIds.length === 0) return;
    setItinerary(await addItineraryStop(itinerary.id, { poiIds }));
  }

  const hasFavoritesNotInItinerary = favoritePois.some((p) => !itineraryPoiIds.has(p.id));

  return {
    regionNameById,
    favoritePois,
    viewedPois,
    visitedPois,
    itineraryPoiIds,
    favoritesByRegion,
    favoritesRegionProgress,
    tripDays,
    hasFavoritesNotInItinerary,
    handleAddToItinerary,
    handleRemoveFromItinerary,
    handleAddAllToItinerary,
    handleAddRegionToItinerary
  };
}
