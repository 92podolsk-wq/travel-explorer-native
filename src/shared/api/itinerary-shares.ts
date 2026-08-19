import type { FriendUser } from "@/entities/user/model/types";
import type { Itinerary } from "@/entities/itinerary/model/types";
import type { ItineraryShareRole, SharedItinerarySummary } from "@/entities/sharing/model/types";
import { apiJson } from "./client";

export function getItineraryShareTargets(
  itineraryId: string
): Promise<{ users: (FriendUser & { role: ItineraryShareRole })[] }> {
  return apiJson<{ users: (FriendUser & { role: ItineraryShareRole })[] }>(`/api/me/itineraries/${itineraryId}/shares`);
}

export function shareItineraryWithFriend(
  itineraryId: string,
  friendUserId: string,
  role: ItineraryShareRole = "viewer"
): Promise<{ success: boolean }> {
  return apiJson<{ success: boolean }>(`/api/me/itineraries/${itineraryId}/shares`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ friendUserId, role })
  });
}

export function unshareItineraryWithFriend(itineraryId: string, friendId: string): Promise<{ success: boolean }> {
  return apiJson<{ success: boolean }>(`/api/me/itineraries/${itineraryId}/shares/${friendId}`, { method: "DELETE" });
}

export function getItinerariesSharedWithMe(): Promise<{ itineraries: SharedItinerarySummary[] }> {
  return apiJson<{ itineraries: SharedItinerarySummary[] }>("/api/me/itineraries/shared-with-me");
}

export function getSharedItinerary(itineraryId: string): Promise<Itinerary> {
  return apiJson<Itinerary>(`/api/me/itineraries/shared-with-me/${itineraryId}`);
}
