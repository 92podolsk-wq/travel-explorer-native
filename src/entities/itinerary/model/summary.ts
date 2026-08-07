import type { ItineraryStopPoint } from "./types";
import { stopPointCoordinates, stopPointDurationMinutes } from "./stop-point";
import { haversineDistanceMeters } from "@/shared/lib/geo";

const WALKING_METERS_PER_MINUTE = 75;

export function computeItinerarySummary(stops: { point: ItineraryStopPoint; durationOverrideMinutes?: number | null }[]) {
  const visitMinutes = stops.reduce(
    (sum, stop) => sum + (stop.durationOverrideMinutes ?? stopPointDurationMinutes(stop.point)),
    0
  );

  let walkingDistanceMeters = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    walkingDistanceMeters += haversineDistanceMeters(
      stopPointCoordinates(stops[i].point),
      stopPointCoordinates(stops[i + 1].point)
    );
  }
  const walkingMinutes = Math.round(walkingDistanceMeters / WALKING_METERS_PER_MINUTE);

  return {
    visitMinutes,
    walkingMinutes,
    totalMinutes: visitMinutes + walkingMinutes,
    walkingDistanceMeters
  };
}
