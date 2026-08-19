import type { Coordinates } from "@/entities/poi/model/types";

const EARTH_RADIUS_METERS = 6371000;

export function haversineDistanceMeters(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

const TRANSITION_METERS_PER_MINUTE = 75;
const MIN_TRANSITION_MINUTES = 5;
const MAX_TRANSITION_MINUTES = 60;

export function estimateTransitionMinutes(distanceMeters: number): number {
  return Math.min(MAX_TRANSITION_MINUTES, Math.max(MIN_TRANSITION_MINUTES, Math.round(distanceMeters / TRANSITION_METERS_PER_MINUTE)));
}

export function formatDistance(meters: number, unit: "km" | "mi" = "km"): string {
  if (unit === "mi") {
    const feet = meters * 3.28084;
    if (feet < 1000) return `${Math.round(feet / 10) * 10} ft`;
    return `${(meters / 1609.344).toFixed(1)} mi`;
  }
  if (meters < 1000) {
    return `${Math.round(meters / 10) * 10} м`;
  }
  return `${(meters / 1000).toFixed(1)} км`;
}

// Average adult step length is roughly 0.75m (a common rule of thumb: ~1300
// steps per km) — good enough for a rough "how many steps is that" hint, not
// meant to be precise.
const METERS_PER_STEP = 0.75;

export function estimateSteps(meters: number): number {
  return Math.round(meters / METERS_PER_STEP);
}

export function formatSteps(meters: number): string {
  return estimateSteps(meters).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
