import * as Location from "expo-location";
import type { Poi } from "@/entities/poi/model/types";
import type { Language } from "@/shared/i18n/types";
import { saveNearbyPoiRegistry, type NearbyPoiEntry } from "@/shared/storage/nearby-poi-registry";
import { NEARBY_GEOFENCE_TASK } from "./nearby-locations-task";

const RADIUS_METERS = 500;
// Android caps geofences per app; keep well under it.
const MAX_GEOFENCES = 100;

export async function requestNearbyAlertsPermissions(): Promise<boolean> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== "granted") return false;
  const background = await Location.requestBackgroundPermissionsAsync();
  return background.status === "granted";
}

export async function refreshNearbyGeofences(favoritePois: Poi[], language: Language): Promise<void> {
  const entries: NearbyPoiEntry[] = favoritePois.slice(0, MAX_GEOFENCES).map((poi) => ({
    id: poi.id,
    name: poi.nameByLanguage?.[language] ?? poi.name,
    regionId: poi.regionId,
    lat: poi.coordinates.lat,
    lng: poi.coordinates.lng
  }));

  await saveNearbyPoiRegistry(entries);

  if (entries.length === 0) {
    await stopNearbyGeofencing();
    return;
  }

  await Location.startGeofencingAsync(
    NEARBY_GEOFENCE_TASK,
    entries.map((entry) => ({
      identifier: entry.id,
      latitude: entry.lat,
      longitude: entry.lng,
      radius: RADIUS_METERS,
      notifyOnEnter: true,
      notifyOnExit: false
    }))
  );
}

export async function stopNearbyGeofencing(): Promise<void> {
  const isRunning = await Location.hasStartedGeofencingAsync(NEARBY_GEOFENCE_TASK);
  if (isRunning) await Location.stopGeofencingAsync(NEARBY_GEOFENCE_TASK);
}
