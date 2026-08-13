export type User = {
  id: string;
  email: string;
  username: string;
  name: string | null;
  avatarId: string | null;
  hideFromSearch: boolean;
  createdAt: string;
};

export type FriendUser = {
  id: string;
  username: string;
  name: string | null;
  avatarId: string | null;
};

export type FriendEntry = {
  id: string;
  createdAt: string;
  user: FriendUser;
};

export type FriendsResponse = {
  friends: FriendEntry[];
  incoming: FriendEntry[];
  outgoing: FriendEntry[];
};

export type UserPoiState = {
  favoritePoiIds: string[];
  viewedPoiIds: string[];
  visitedPoiIds: string[];
};

export type AuthMeResponse = {
  user: User | null;
} & Partial<UserPoiState>;
