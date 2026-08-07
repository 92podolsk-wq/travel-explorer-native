export type User = {
  id: string;
  email: string;
  name: string | null;
  avatarId: string | null;
  createdAt: string;
};

export type UserPoiState = {
  favoritePoiIds: string[];
  viewedPoiIds: string[];
  visitedPoiIds: string[];
};

export type AuthMeResponse = {
  user: User | null;
} & Partial<UserPoiState>;
