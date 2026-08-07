import { apiJson } from "./client";
import type { CustomMarker, CustomMarkerInput } from "@/entities/custom-marker/model/types";

export function listCustomMarkers(): Promise<{ markers: CustomMarker[]; limit: number }> {
  return apiJson<{ markers: CustomMarker[]; limit: number }>("/api/me/custom-markers");
}

export function createCustomMarker(input: CustomMarkerInput): Promise<CustomMarker> {
  return apiJson<CustomMarker>("/api/me/custom-markers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

export function deleteCustomMarker(id: string): Promise<{ ok: true }> {
  return apiJson<{ ok: true }>(`/api/me/custom-markers/${id}`, { method: "DELETE" });
}
