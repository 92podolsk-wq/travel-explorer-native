import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

export type ChecklistItem = { id: string; label: string; checked: boolean };

export type PackingChecklistState = {
  tripName: string | null;
  tripStartDate: string | null;
  tripEndDate: string | null;
  packingItems: ChecklistItem[];
  documentItems: ChecklistItem[];
  shoppingItems: ChecklistItem[];
  departureItems: ChecklistItem[];
  reminderNotificationId: string | null;
};

const STORAGE_KEY = "wayora:packingChecklist";
const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;

const DEFAULT_PACKING_LABELS = [
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

const DEFAULT_DOCUMENT_LABELS = ["Паспорт / документы", "Билеты и бронирования", "Деньги и карты"];

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function itemsFrom(labels: string[]): ChecklistItem[] {
  return labels.map((label) => ({ id: makeId(), label, checked: false }));
}

function defaultState(): PackingChecklistState {
  return {
    tripName: null,
    tripStartDate: null,
    tripEndDate: null,
    packingItems: itemsFrom(DEFAULT_PACKING_LABELS),
    documentItems: itemsFrom(DEFAULT_DOCUMENT_LABELS),
    shoppingItems: [],
    departureItems: [],
    reminderNotificationId: null
  };
}

// Devices that installed the app before this redesign may still have the old
// shape saved (`tripDate`, no document/departure arrays) — backfill it on
// read instead of discarding the user's saved items.
type LegacyPackingChecklistState = {
  tripDate?: string | null;
  packingItems?: ChecklistItem[];
  shoppingItems?: ChecklistItem[];
};

function migrateState(raw: PackingChecklistState & LegacyPackingChecklistState): PackingChecklistState {
  return {
    tripName: raw.tripName ?? null,
    tripStartDate: raw.tripStartDate ?? raw.tripDate ?? null,
    tripEndDate: raw.tripEndDate ?? null,
    packingItems: raw.packingItems ?? [],
    documentItems: raw.documentItems ?? [],
    shoppingItems: raw.shoppingItems ?? [],
    departureItems: raw.departureItems ?? [],
    reminderNotificationId: raw.reminderNotificationId ?? null
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
    return migrateState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

async function persist(state: PackingChecklistState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hasUncheckedItems(state: {
  packingItems: ChecklistItem[];
  documentItems: ChecklistItem[];
  shoppingItems: ChecklistItem[];
  departureItems: ChecklistItem[];
}): boolean {
  return (
    state.packingItems.some((item) => !item.checked) ||
    state.documentItems.some((item) => !item.checked) ||
    state.shoppingItems.some((item) => !item.checked) ||
    state.departureItems.some((item) => !item.checked)
  );
}

/** Cancels any stale reminder and reschedules one if the trip is <24h away with unpacked items. */
async function syncReminder(state: PackingChecklistState): Promise<PackingChecklistState> {
  if (state.reminderNotificationId) {
    await Notifications.cancelScheduledNotificationAsync(state.reminderNotificationId).catch(() => {});
  }

  const hasUnchecked = hasUncheckedItems(state);
  const tripTime = state.tripStartDate ? new Date(state.tripStartDate).getTime() : null;

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
  patch: Partial<
    Pick<
      PackingChecklistState,
      "tripName" | "tripStartDate" | "tripEndDate" | "packingItems" | "documentItems" | "shoppingItems" | "departureItems"
    >
  >
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
  tripStartDate: string | null;
  packingItems: ChecklistItem[];
  documentItems: ChecklistItem[];
  shoppingItems: ChecklistItem[];
  departureItems: ChecklistItem[];
}): Promise<void> {
  const existingId = await AsyncStorage.getItem(SERVER_REMINDER_KEY);
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId).catch(() => {});
  }

  const hasUnchecked = hasUncheckedItems(content);
  const tripTime = content.tripStartDate ? new Date(content.tripStartDate).getTime() : null;

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
