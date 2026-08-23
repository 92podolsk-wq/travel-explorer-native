import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { NEARBY_POI_NOTIFICATION_TYPE } from "@/shared/geofencing/nearby-locations-task";
import { addNotificationHistoryEntry } from "@/shared/storage/notification-history";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { navigationRef } from "@/navigation/TabNavigator";

// Routes a tapped nearby-POI push notification to the Map tab with the
// relevant region/POI selected, and separately logs remote (FCM) pushes to
// the in-app notification history.
export function useNotificationRouting() {
  const setActiveRegion = useExplorerStore((state) => state.setActiveRegion);
  const setSelectedPoiId = useExplorerStore((state) => state.setSelectedPoiId);

  useEffect(() => {
    function handleNotificationResponse(response: Notifications.NotificationResponse) {
      const data = response.notification.request.content.data as { type?: string; poiId?: string; regionId?: string };
      if (data?.type !== NEARBY_POI_NOTIFICATION_TYPE || !data.poiId) return;
      if (data.regionId) setActiveRegion(data.regionId);
      setSelectedPoiId(data.poiId);
      if (navigationRef.isReady()) navigationRef.navigate("Map");
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(response);
    });
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => subscription.remove();
  }, [setActiveRegion, setSelectedPoiId]);

  // Remote (FCM) pushes only — the geofencing task already logs nearby-POI
  // notifications directly so they still show up even if the app was killed.
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      const data = content.data as { type?: string } | undefined;
      if (data?.type === NEARBY_POI_NOTIFICATION_TYPE) return;
      addNotificationHistoryEntry({
        title: content.title ?? "",
        body: content.body ?? "",
        receivedAt: Date.now(),
        data
      }).catch(() => {});
    });
    return () => subscription.remove();
  }, []);
}
