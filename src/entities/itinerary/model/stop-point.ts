import type { ItineraryStopPoint } from "./types";
import type { Coordinates } from "@/entities/poi/model/types";
import type { Language } from "@/shared/i18n/types";
import { resolveOfflinePhotoUri } from "@/shared/map/offline-maps";

export const MARKER_STOP_DEFAULT_DURATION_MINUTES = 30;

export function stopPointId(point: ItineraryStopPoint): string {
  return point.kind === "poi" ? point.poi.id : point.marker.id;
}

export function stopPointCoordinates(point: ItineraryStopPoint): Coordinates {
  return point.kind === "poi" ? point.poi.coordinates : { lat: point.marker.lat, lng: point.marker.lng };
}

export function stopPointDurationMinutes(point: ItineraryStopPoint): number {
  return point.kind === "poi" ? point.poi.durationMinutes : MARKER_STOP_DEFAULT_DURATION_MINUTES;
}

export function stopPointRegionId(point: ItineraryStopPoint): string | null {
  return point.kind === "poi" ? point.poi.regionId : null;
}

export function stopPointColor(point: ItineraryStopPoint): string | null {
  return point.kind === "marker" ? point.marker.color : null;
}

export function stopPointPhotoUrl(point: ItineraryStopPoint): string | null {
  if (point.kind !== "poi") return null;
  const photo = point.poi.photos[0];
  return photo ? resolveOfflinePhotoUri(photo.id, photo.url) : null;
}

export function stopPointPhotoAlt(point: ItineraryStopPoint): string | null {
  if (point.kind !== "poi") return null;
  return point.poi.photos[0]?.alt || point.poi.name;
}

export function stopPointName(point: ItineraryStopPoint, language: Language, fallbackLabel: string): string {
  if (point.kind === "poi") {
    return point.poi.nameByLanguage?.[language] ?? point.poi.name;
  }
  return point.marker.label.trim() || fallbackLabel;
}

export function stopPointDescription(point: ItineraryStopPoint): string {
  return point.kind === "poi" ? point.poi.description : "";
}
