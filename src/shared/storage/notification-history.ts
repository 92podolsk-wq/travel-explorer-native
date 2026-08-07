import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "wayora:notificationHistory";
const MAX_ENTRIES = 100;

export type NotificationHistoryEntry = {
  id: string;
  title: string;
  body: string;
  receivedAt: number;
  read: boolean;
  data?: Record<string, unknown>;
};

export async function getNotificationHistory(): Promise<NotificationHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addNotificationHistoryEntry(
  entry: Omit<NotificationHistoryEntry, "id" | "read">
): Promise<void> {
  const list = await getNotificationHistory();
  const next = [
    { ...entry, id: `${entry.receivedAt}-${Math.random().toString(36).slice(2, 8)}`, read: false },
    ...list
  ].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function markAllNotificationsRead(): Promise<void> {
  const list = await getNotificationHistory();
  await AsyncStorage.setItem(KEY, JSON.stringify(list.map((entry) => ({ ...entry, read: true }))));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const list = await getNotificationHistory();
  return list.filter((entry) => !entry.read).length;
}
