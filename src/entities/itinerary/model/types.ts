import type { CustomMarker } from "@/entities/custom-marker/model/types";
import type { Poi } from "@/entities/poi/model/types";

export type ItineraryStopPoint = { kind: "poi"; poi: Poi } | { kind: "marker"; marker: CustomMarker };

export type ItineraryStopWithPoi = {
  id: string;
  day: number;
  position: number;
  point: ItineraryStopPoint;
  durationOverrideMinutes: number | null;
  notes: string | null;
};

export type ItineraryDayInfo = {
  day: number;
  title: string | null;
  startMinutes: number | null;
  lunchEnabled: boolean | null;
  lunchStartMinutes: number | null;
  lunchDurationMinutes: number | null;
  notes: string | null;
};

export type Itinerary = {
  id: string;
  title: string;
  shareToken: string;
  startDate: string | null;
  stops: ItineraryStopWithPoi[];
  days: ItineraryDayInfo[];
};

export type ItinerarySummary = {
  id: string;
  title: string;
};
