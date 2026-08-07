import { apiFetch } from "./client";

export function toggleFavoriteApi(poiId: string) {
  return apiFetch(`/api/me/favorites/${poiId}`, { method: "POST" });
}

export function toggleVisitedApi(poiId: string) {
  return apiFetch(`/api/me/visited/${poiId}`, { method: "POST" });
}

export function markViewedApi(poiId: string) {
  return apiFetch(`/api/me/viewed/${poiId}`, { method: "POST" });
}

export function clearFavoritesApi() {
  return apiFetch("/api/me/favorites", { method: "DELETE" });
}

export function clearVisitedApi() {
  return apiFetch("/api/me/visited", { method: "DELETE" });
}

export function clearViewedApi() {
  return apiFetch("/api/me/viewed", { method: "DELETE" });
}
