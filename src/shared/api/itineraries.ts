import { apiJson } from "./client";
import type { Itinerary, ItinerarySummary } from "@/entities/itinerary/model/types";

export function listItineraries(): Promise<ItinerarySummary[]> {
  return apiJson<ItinerarySummary[]>("/api/me/itineraries");
}

export function createItinerary(): Promise<Itinerary> {
  return apiJson<Itinerary>("/api/me/itineraries", { method: "POST" });
}

export function getItinerary(itineraryId: string): Promise<Itinerary> {
  return apiJson<Itinerary>(`/api/me/itineraries/${itineraryId}`);
}

export function renameItinerary(itineraryId: string, title: string): Promise<Itinerary> {
  return apiJson<Itinerary>(`/api/me/itineraries/${itineraryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title })
  });
}

export function updateItineraryStartDate(itineraryId: string, startDate: string | null): Promise<Itinerary> {
  return apiJson<Itinerary>(`/api/me/itineraries/${itineraryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startDate })
  });
}

export function deleteItinerary(itineraryId: string): Promise<{ ok: true }> {
  return apiJson<{ ok: true }>(`/api/me/itineraries/${itineraryId}`, { method: "DELETE" });
}

export function addItineraryDay(itineraryId: string): Promise<Itinerary> {
  return apiJson<Itinerary>(`/api/me/itineraries/${itineraryId}/days`, { method: "POST" });
}

export function removeItineraryDay(itineraryId: string, day: number): Promise<Itinerary> {
  return apiJson<Itinerary>(`/api/me/itineraries/${itineraryId}/days/${day}`, { method: "DELETE" });
}

export type DayConfigPatch = {
  title?: string;
  startMinutes?: number | null;
  lunchEnabled?: boolean | null;
  lunchStartMinutes?: number | null;
  lunchDurationMinutes?: number | null;
  notes?: string | null;
};

export function updateItineraryDay(itineraryId: string, day: number, patch: DayConfigPatch): Promise<Itinerary> {
  return apiJson<Itinerary>(`/api/me/itineraries/${itineraryId}/days/${day}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch)
  });
}

export type GenerateItineraryInput = {
  regionId: string;
  days: number;
  hoursPerDay: number;
  source: "favorites" | "recommended";
  language?: string;
};

export function generateItinerary(itineraryId: string, input: GenerateItineraryInput): Promise<Itinerary> {
  return apiJson<Itinerary>(`/api/me/itineraries/${itineraryId}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

export function addItineraryStop(
  itineraryId: string,
  input: { poiId?: string; poiIds?: string[]; customMarkerId?: string }
): Promise<Itinerary> {
  return apiJson<Itinerary>(`/api/me/itineraries/${itineraryId}/stops`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

export function clearItineraryStops(itineraryId: string): Promise<Itinerary> {
  return apiJson<Itinerary>(`/api/me/itineraries/${itineraryId}/stops`, { method: "DELETE" });
}

export function removeItineraryStop(itineraryId: string, stopId: string): Promise<Itinerary> {
  return apiJson<Itinerary>(`/api/me/itineraries/${itineraryId}/stops/${stopId}`, { method: "DELETE" });
}

export function updateItineraryStop(
  itineraryId: string,
  stopId: string,
  patch: { day?: number; durationOverrideMinutes?: number | null; notes?: string | null }
): Promise<Itinerary> {
  return apiJson<Itinerary>(`/api/me/itineraries/${itineraryId}/stops/${stopId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch)
  });
}

export function moveItineraryStop(
  itineraryId: string,
  stopId: string,
  day: number,
  orderedStopIds: string[]
): Promise<Itinerary> {
  return apiJson<Itinerary>(`/api/me/itineraries/${itineraryId}/stops/${stopId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ day, orderedStopIds })
  });
}

export function reorderItineraryDay(itineraryId: string, day: number, orderedStopIds: string[]): Promise<Itinerary> {
  return apiJson<Itinerary>(`/api/me/itineraries/${itineraryId}/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ day, orderedStopIds })
  });
}
