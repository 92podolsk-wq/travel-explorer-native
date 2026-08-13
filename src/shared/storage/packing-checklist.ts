import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

export type ChecklistItem = { id: string; label: string; checked: boolean };

export type PackingChecklistState = {
  tripDate: string | null;
  packingItems: ChecklistItem[];
  shoppingItems: ChecklistItem[];
  reminderNotificationId: string | null;
};

const STORAGE_KEY = "wayora:packingChecklist";
const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;

const DEFAULT_PACKING_LABELS = [
  "Паспорт / документы",
  "Билеты и бронирования",
  "Деньги и карты",
  "Зарядка и переходник",
  "Power bank",
  "Лекарства",
  "Зубная щётка и паста",
  "Туалетные принадлежности",
  "Смена одежды",
  "Наушники",
  "Солнцезащитные очки",
  "Бытовая аптечка"
];

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultState(): PackingChecklistState {
  return {
    tripDate: null,
    packingItems: DEFAULT_PACKING_LABELS.map((label) => ({ id: makeId(), label, checked: false })),
    shoppingItems: [],
    reminderNotificationId: null
  };
}

export async function getChecklistState(): Promise<PackingChecklistState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = defaultState();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw) as PackingChecklistState;
  } catch {
    return defaultState();
  }
}

async function persist(state: PackingChecklistState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Cancels any stale reminder and reschedules one if the trip is <24h away with unpacked items. */
async function syncReminder(state: PackingChecklistState): Promise<PackingChecklistState> {
  if (state.reminderNotificationId) {
    await Notifications.cancelScheduledNotificationAsync(state.reminderNotificationId).catch(() => {});
  }

  const hasUnchecked = state.packingItems.some((item) => !item.checked);
  const tripTime = state.tripDate ? new Date(state.tripDate).getTime() : null;

  if (!tripTime || !hasUnchecked || tripTime <= Date.now()) {
    return { ...state, reminderNotificationId: null };
  }

  const reminderTime = Math.max(tripTime - REMINDER_LEAD_MS, Date.now() + 5_000);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Пора собирать чемодан",
      body: "До поездки меньше суток, а в чек-листе сборов остались неотмеченные пункты."
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(reminderTime) }
  }).catch(() => null);

  return { ...state, reminderNotificationId: id };
}

/** Applies a partial update, re-syncs the reminder, persists, and returns the new state. */
export async function updateChecklistState(
  current: PackingChecklistState,
  patch: Partial<Pick<PackingChecklistState, "tripDate" | "packingItems" | "shoppingItems">>
): Promise<PackingChecklistState> {
  const merged = { ...current, ...patch };
  const withReminder = await syncReminder(merged);
  await persist(withReminder);
  return withReminder;
}

const SERVER_REMINDER_KEY = "wayora:packingChecklistServerReminderId";

// Mirrors syncReminder's scheduling logic for the server-backed checklist
// (used once a user is logged in). The reminder notification is inherently
// per-device, so its id is kept in a storage key separate from the synced
// checklist content rather than round-tripped to the server.
export async function syncServerChecklistReminder(content: {
  tripDate: string | null;
  packingItems: ChecklistItem[];
}): Promise<void> {
  const existingId = await AsyncStorage.getItem(SERVER_REMINDER_KEY);
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId).catch(() => {});
  }

  const hasUnchecked = content.packingItems.some((item) => !item.checked);
  const tripTime = content.tripDate ? new Date(content.tripDate).getTime() : null;

  if (!tripTime || !hasUnchecked || tripTime <= Date.now()) {
    await AsyncStorage.removeItem(SERVER_REMINDER_KEY);
    return;
  }

  const reminderTime = Math.max(tripTime - REMINDER_LEAD_MS, Date.now() + 5_000);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Пора собирать чемодан",
      body: "До поездки меньше суток, а в чек-листе сборов остались неотмеченные пункты."
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(reminderTime) }
  }).catch(() => null);

  if (id) {
    await AsyncStorage.setItem(SERVER_REMINDER_KEY, id);
  } else {
    await AsyncStorage.removeItem(SERVER_REMINDER_KEY);
  }
}
