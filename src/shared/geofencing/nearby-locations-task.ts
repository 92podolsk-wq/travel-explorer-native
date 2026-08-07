import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { findNearbyPoiEntry } from "@/shared/storage/nearby-poi-registry";
import { addNotificationHistoryEntry } from "@/shared/storage/notification-history";

export const NEARBY_GEOFENCE_TASK = "nearby-favorite-locations";
export const NEARBY_POI_NOTIFICATION_TYPE = "nearby-poi";

// Defined at module load time (imported once from index.ts) so the task is
// registered before Android needs to run it in a headless JS context, i.e.
// even when the app process itself isn't running.
TaskManager.defineTask(NEARBY_GEOFENCE_TASK, async ({ data, error }) => {
  if (error) return;
  const { eventType, region } = data as {
    eventType: Location.LocationGeofencingEventType;
    region: Location.LocationRegion;
  };
  if (eventType !== Location.LocationGeofencingEventType.Enter || !region.identifier) return;

  const entry = await findNearbyPoiEntry(region.identifier);
  if (!entry) return;

  const title = "Локация рядом";
  const body = `«${entry.name}» совсем рядом с вами`;
  const notificationData = { type: NEARBY_POI_NOTIFICATION_TYPE, poiId: entry.id, regionId: entry.regionId };

  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: notificationData },
    trigger: null
  });
  await addNotificationHistoryEntry({ title, body, receivedAt: Date.now(), data: notificationData });
});
