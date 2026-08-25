import { useState } from "react";
import { Alert, Linking } from "react-native";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { refreshNearbyGeofences, requestNearbyAlertsPermissions, stopNearbyGeofencing } from "@/shared/geofencing/manage-geofences";

export function useNearbyAlertsToggle() {
  const t = useTranslations();
  const language = useExplorerStore((state) => state.language);
  const pois = useExplorerStore((state) => state.pois);
  const favorites = useExplorerStore((state) => state.favorites);
  const isNearbyAlertsEnabled = useExplorerStore((state) => state.isNearbyAlertsEnabled);
  const setNearbyAlertsEnabled = useExplorerStore((state) => state.setNearbyAlertsEnabled);
  const [isTogglingNearbyAlerts, setIsTogglingNearbyAlerts] = useState(false);

  async function handleToggleNearbyAlerts(value: boolean) {
    setIsTogglingNearbyAlerts(true);
    try {
      if (value) {
        const granted = await requestNearbyAlertsPermissions();
        if (!granted) {
          Alert.alert(t.auth.nearbyAlertsPermissionDenied, t.auth.nearbyAlertsPermissionHint, [
            { text: t.auth.cancel, style: "cancel" },
            { text: t.auth.openSettings, onPress: () => Linking.openSettings() }
          ]);
          return;
        }
        setNearbyAlertsEnabled(true);
        const favoritePois = pois.filter((poi) => favorites.includes(poi.id));
        await refreshNearbyGeofences(favoritePois, language);
      } else {
        setNearbyAlertsEnabled(false);
        await stopNearbyGeofencing();
      }
    } finally {
      setIsTogglingNearbyAlerts(false);
    }
  }

  return { isNearbyAlertsEnabled, isTogglingNearbyAlerts, handleToggleNearbyAlerts };
}
