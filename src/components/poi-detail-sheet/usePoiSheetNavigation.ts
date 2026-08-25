import { useMemo, useRef, useState } from "react";
import type { Poi } from "@/entities/poi/model/types";
import { haversineDistanceMeters } from "@/shared/lib/geo";
import { useExplorerStore } from "@/shared/model/explorer-store";

// Tracks navigating between sibling POIs within an open detail sheet (via
// swipe or the prev/next buttons) — "next" always suggests the nearest place
// in the region not yet seen this session, and "previous" retraces the same
// path the user actually took rather than a fixed list order.
//
// `resetHistory`/`isInternalNavRef` are exposed rather than managed
// internally because the decision of *when* to reset (fresh open vs.
// external POI change vs. internal swipe-nav) depends on the sheet's
// entrance/exit animation lifecycle, which lives in the parent.
export function usePoiSheetNavigation(poi: Poi | null) {
  const pois = useExplorerStore((state) => state.pois);
  const setSelectedPoiId = useExplorerStore((state) => state.setSelectedPoiId);

  const [navHistory, setNavHistory] = useState<string[]>(poi ? [poi.id] : []);
  const isInternalNavRef = useRef(false);

  function resetHistory(poiId: string) {
    setNavHistory([poiId]);
  }

  const regionPois = useMemo(() => (poi ? pois.filter((p) => p.regionId === poi.regionId) : []), [pois, poi]);

  const nextPreviewPoi = useMemo(() => {
    if (!poi) return null;
    const visited = new Set(navHistory);
    let nearest: Poi | null = null;
    let nearestDistance = Infinity;
    for (const candidate of regionPois) {
      if (visited.has(candidate.id)) continue;
      const distance = haversineDistanceMeters(poi.coordinates, candidate.coordinates);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = candidate;
      }
    }
    return nearest;
  }, [poi, regionPois, navHistory]);

  const previousPreviewPoi = useMemo(() => {
    if (navHistory.length < 2) return null;
    const previousId = navHistory[navHistory.length - 2];
    return pois.find((p) => p.id === previousId) ?? null;
  }, [navHistory, pois]);

  function goForward() {
    if (!nextPreviewPoi) return;
    isInternalNavRef.current = true;
    setNavHistory((prev) => [...prev, nextPreviewPoi.id]);
    setSelectedPoiId(nextPreviewPoi.id);
  }

  function goBack() {
    if (!previousPreviewPoi) return;
    isInternalNavRef.current = true;
    setNavHistory((prev) => prev.slice(0, -1));
    setSelectedPoiId(previousPreviewPoi.id);
  }

  return {
    isInternalNavRef,
    resetHistory,
    nextPreviewPoi,
    previousPreviewPoi,
    hasNextPlace: nextPreviewPoi !== null,
    hasPreviousPlace: previousPreviewPoi !== null,
    goForward,
    goBack
  };
}
