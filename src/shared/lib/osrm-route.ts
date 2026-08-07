import type { Coordinates } from "@/entities/poi/model/types";

export type WalkingRoute = {
  lineCoordinates: [number, number][];
  legDistancesMeters: number[];
};

type OsrmResponse = {
  routes?: Array<{
    geometry?: { coordinates?: [number, number][] };
    legs?: Array<{ distance?: number }>;
  }>;
};

export async function fetchWalkingRoute(coordinates: Coordinates[]): Promise<WalkingRoute | null> {
  if (coordinates.length < 2) {
    return null;
  }

  const coordStr = coordinates.map((c) => `${c.lng},${c.lat}`).join(";");

  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/foot/${coordStr}?overview=full&geometries=geojson`
    );
    if (!res.ok) return null;

    const data = (await res.json()) as OsrmResponse;
    const route = data.routes?.[0];
    const lineCoordinates = route?.geometry?.coordinates;
    const legs = route?.legs;

    if (!Array.isArray(lineCoordinates) || lineCoordinates.length === 0 || !Array.isArray(legs)) {
      return null;
    }

    return {
      lineCoordinates,
      legDistancesMeters: legs.map((leg) => leg.distance ?? 0)
    };
  } catch {
    return null;
  }
}
