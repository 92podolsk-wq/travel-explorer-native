import type { PackingChecklist } from "@/entities/checklist/model/types";
import type { FriendUser } from "@/entities/user/model/types";
import type { SharedChecklist } from "@/entities/sharing/model/types";
import { apiJson } from "./client";

export function getServerChecklist(): Promise<{ checklist: PackingChecklist }> {
  return apiJson<{ checklist: PackingChecklist }>("/api/me/checklist");
}

export function updateServerChecklist(patch: Partial<PackingChecklist>): Promise<{ checklist: PackingChecklist }> {
  return apiJson<{ checklist: PackingChecklist }>("/api/me/checklist", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch)
  });
}

export function getChecklistShareTargets(): Promise<{ users: FriendUser[] }> {
  return apiJson<{ users: FriendUser[] }>("/api/me/checklist/shares");
}

export function shareChecklistWithFriend(friendUserId: string): Promise<{ success: boolean }> {
  return apiJson<{ success: boolean }>("/api/me/checklist/shares", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ friendUserId })
  });
}

export function unshareChecklistWithFriend(friendId: string): Promise<{ success: boolean }> {
  return apiJson<{ success: boolean }>(`/api/me/checklist/shares/${friendId}`, { method: "DELETE" });
}

export function getChecklistsSharedWithMe(): Promise<{ checklists: SharedChecklist[] }> {
  return apiJson<{ checklists: SharedChecklist[] }>("/api/me/checklists/shared-with-me");
}
