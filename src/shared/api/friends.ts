import type { FriendsResponse, FriendUser } from "@/entities/user/model/types";
import { apiJson } from "./client";

export function searchUsers(query: string): Promise<{ users: FriendUser[] }> {
  return apiJson<{ users: FriendUser[] }>(`/api/users/search?q=${encodeURIComponent(query)}`);
}

export function getFriends(): Promise<FriendsResponse> {
  return apiJson<FriendsResponse>("/api/me/friends");
}

export function sendFriendRequest(username: string): Promise<{ success: boolean }> {
  return apiJson<{ success: boolean }>("/api/me/friends/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });
}

export function acceptFriendRequest(friendshipId: string): Promise<{ success: boolean }> {
  return apiJson<{ success: boolean }>(`/api/me/friends/${friendshipId}/accept`, { method: "POST" });
}

export function removeFriendship(friendshipId: string): Promise<{ success: boolean }> {
  return apiJson<{ success: boolean }>(`/api/me/friends/${friendshipId}`, { method: "DELETE" });
}
