import { useMemo } from "react";
import type { Region } from "@/entities/region/model/types";
import { haversineDistanceMeters } from "@/shared/lib/geo";
import { shuffle } from "@/shared/lib/shuffle";
import { useExplorerStore } from "@/shared/model/explorer-store";

export function useSwipeDiscoveryCandidates(primaryRegion: Region | null) {
  const pois = useExplorerStore((state) => state.pois);
  const regions = useExplorerStore((state) => state.regions);
  const areas = useExplorerStore((state) => state.areas);
  const activeRegionIds = useExplorerStore((state) => state.activeRegionIds);
  const selectedCategories = useExplorerStore((state) => state.selectedCategories);
  const favorites = useExplorerStore((state) => state.favorites);
  const viewedPoiIds = useExplorerStore((state) => state.viewedPoiIds);
  const language = useExplorerStore((state) => state.language);
  const isSwipeOpen = useExplorerStore((state) => state.isSwipeOpen);

  const swipeCandidates = useMemo(() => {
    const regionPois = pois.filter((poi) => activeRegionIds.includes(poi.regionId));
    const unswiped = regionPois.filter(
      (poi) => !favorites.includes(poi.id) && !viewedPoiIds.includes(poi.id) && selectedCategories.includes(poi.category)
    );
    return shuffle(unswiped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pois, activeRegionIds, selectedCategories, isSwipeOpen]);

  const neighboringSwipeRegions = useMemo(() => {
    if (!primaryRegion) return [];
    const activeCountryId = areas.find((area) => area.id === primaryRegion.areaId)?.countryId;
    if (!activeCountryId) return [];
    return regions
      .filter((region) => region.status === "published" && !activeRegionIds.includes(region.id))
      .filter((region) => areas.find((area) => area.id === region.areaId)?.countryId === activeCountryId)
      .map((region) => ({
        id: region.id,
        name: region.nameByLanguage[language] ?? region.name,
        distance: haversineDistanceMeters(primaryRegion.center, region.center),
        count: pois.filter((poi) => poi.regionId === region.id && !favorites.includes(poi.id) && !viewedPoiIds.includes(poi.id))
          .length
      }))
      .filter((region) => region.count > 0)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [primaryRegion, activeRegionIds, areas, regions, pois, favorites, viewedPoiIds, language]);

  return { swipeCandidates, neighboringSwipeRegions };
}
