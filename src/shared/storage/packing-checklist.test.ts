import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("expo-notifications", () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: "date" }
}));

import * as Notifications from "expo-notifications";
import { getChecklistState, updateChecklistState, type ChecklistCategory, type PackingChecklistState } from "./packing-checklist";

const STORAGE_KEY = "wayora:packingChecklist";

function findCategory(categories: ChecklistCategory[], id: string): ChecklistCategory {
  const category = categories.find((c) => c.id === id);
  if (!category) throw new Error(`category ${id} not found`);
  return category;
}

describe("getChecklistState", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("seeds documents and packing separately for a brand-new install", async () => {
    const state = await getChecklistState();

    expect(state.tripName).toBeNull();
    expect(state.tripStartDate).toBeNull();
    expect(state.tripEndDate).toBeNull();

    const packing = findCategory(state.categories, "packing");
    const documents = findCategory(state.categories, "documents");
    expect(documents.items.map((item) => item.label)).toContain("Паспорт / документы");
    expect(packing.items.map((item) => item.label)).not.toContain("Паспорт / документы");
  });

  it("backfills a pre-redesign stored shape (tripDate, no document/departure arrays)", async () => {
    const legacy = {
      tripDate: "2026-05-12T00:00:00.000Z",
      packingItems: [{ id: "a", label: "Зарядка", checked: false }],
      shoppingItems: [{ id: "b", label: "Сувениры", checked: true }],
      reminderNotificationId: null
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));

    const state = await getChecklistState();

    expect(state.tripStartDate).toBe("2026-05-12T00:00:00.000Z");
    expect(state.tripEndDate).toBeNull();
    expect(state.tripName).toBeNull();
    expect(findCategory(state.categories, "packing").items).toEqual(legacy.packingItems);
    expect(findCategory(state.categories, "shopping").items).toEqual(legacy.shoppingItems);
    expect(findCategory(state.categories, "documents").items).toEqual([]);
    expect(findCategory(state.categories, "departure").items).toEqual([]);
  });

  it("backfills a pre-categories stored shape (4 fixed item arrays, no categories field)", async () => {
    const legacy = {
      tripStartDate: null,
      tripEndDate: null,
      tripName: null,
      packingItems: [{ id: "p1", label: "Зарядка", checked: false }],
      documentItems: [{ id: "d1", label: "Паспорт", checked: true }],
      shoppingItems: [],
      departureItems: [],
      reminderNotificationId: null
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));

    const state = await getChecklistState();

    expect(findCategory(state.categories, "packing").items).toEqual(legacy.packingItems);
    expect(findCategory(state.categories, "documents").items).toEqual(legacy.documentItems);
  });
});

describe("updateChecklistState reminder scheduling", () => {
  const baseState: PackingChecklistState = {
    tripName: null,
    tripStartDate: null,
    tripEndDate: null,
    categories: [
      { id: "packing", title: "Взять с собой", emoji: "🧳", items: [] },
      { id: "documents", title: "Документы", emoji: "📄", items: [] }
    ],
    reminderNotificationId: null
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue("notif-1");
    (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockResolvedValue(undefined);
  });

  it("schedules a reminder when the trip starts soon and an item in any category is unchecked", async () => {
    const soon = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const updated = await updateChecklistState(baseState, {
      tripStartDate: soon,
      categories: [
        ...baseState.categories,
        { id: "departure", title: "Перед выездом", emoji: "🏠", items: [{ id: "d1", label: "Выключить утюг", checked: false }] }
      ]
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(updated.reminderNotificationId).toBe("notif-1");
  });

  it("does not schedule a reminder when every item across all categories is checked", async () => {
    const soon = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const updated = await updateChecklistState(baseState, {
      tripStartDate: soon,
      categories: [
        { id: "packing", title: "Взять с собой", emoji: "🧳", items: [{ id: "p1", label: "Зарядка", checked: true }] },
        { id: "documents", title: "Документы", emoji: "📄", items: [] }
      ]
    });

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(updated.reminderNotificationId).toBeNull();
  });

  it("does not schedule a reminder when the trip date is in the past", async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const updated = await updateChecklistState(baseState, {
      tripStartDate: past,
      categories: [
        { id: "packing", title: "Взять с собой", emoji: "🧳", items: [{ id: "p1", label: "Зарядка", checked: false }] },
        { id: "documents", title: "Документы", emoji: "📄", items: [] }
      ]
    });

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(updated.reminderNotificationId).toBeNull();
  });

  it("cancels a stale reminder when re-syncing", async () => {
    const withReminder = { ...baseState, reminderNotificationId: "old-notif" };

    await updateChecklistState(withReminder, { tripName: "Осака" });

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("old-notif");
  });
});
