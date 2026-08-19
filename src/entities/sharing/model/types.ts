import type { FriendUser } from "@/entities/user/model/types";
import type { PackingChecklist } from "@/entities/checklist/model/types";
import type { Itinerary, ItinerarySummary } from "@/entities/itinerary/model/types";

export type SharedChecklist = {
  owner: FriendUser;
  checklist: PackingChecklist;
};

export type ItineraryShareRole = "viewer" | "editor";

export type SharedItinerarySummary = {
  owner: FriendUser;
  itinerary: ItinerarySummary;
  role: ItineraryShareRole;
};

export type SharedItinerary = {
  owner: FriendUser;
  itinerary: Itinerary;
  role: ItineraryShareRole;
};
