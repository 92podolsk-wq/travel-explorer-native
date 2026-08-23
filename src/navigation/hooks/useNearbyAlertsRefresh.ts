import { useEffect } from "react";
import { refreshNearbyGeofences } from "@/shared/geofencing/manage-geofences";
import { useExplorerStore } from "@/shared/model/explorer-store";

// Keeps the on-device geofences in sync with the user's current favorites
// whenever nearby-place alerts are enabled.
export function useNearbyAlertsRefresh() {
  const isNearbyAlertsEnabled = useExplorerStore((state) => state.isNearbyAlertsEnabled);
  const favorites = useExplorerStore((state) => state.favorites);
  const pois = useExplorerStore((state) => state.pois);
  const language = useExplorerStore((state) => state.language);

  useEffect(() => {
    if (!isNearbyAlertsEnabled) return;
    const favoritePois = pois.filter((poi) => favorites.includes(poi.id));
    refreshNearbyGeofences(favoritePois, language).catch(() => {});
  }, [isNearbyAlertsEnabled, favorites, pois, language]);
}
