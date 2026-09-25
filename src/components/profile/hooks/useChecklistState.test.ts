import { renderHook, waitFor } from "@testing-library/react-native";
import { useChecklistState } from "./useChecklistState";
import { getServerChecklist } from "@/shared/api/checklist";
import { getChecklistState } from "@/shared/storage/packing-checklist";
import type { PackingChecklist } from "@/entities/checklist/model/types";

jest.mock("@/shared/api/checklist", () => ({ getServerChecklist: jest.fn() }));

jest.mock("expo-notifications", () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notif-1"),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: { DATE: "date" }
}));

jest.mock("@/shared/storage/packing-checklist", () => {
  const actual = jest.requireActual("@/shared/storage/packing-checklist");
  return { ...actual, getChecklistState: jest.fn() };
});

const localState = {
  tripName: "Local trip",
  tripStartDate: null,
  tripEndDate: null,
  categories: [{ id: "packing", title: "Взять с собой", emoji: "🧳", items: [] }],
  reminderNotificationId: null
};

describe("useChecklistState", () => {
  beforeEach(() => {
    (getServerChecklist as jest.Mock).mockReset();
    (getChecklistState as jest.Mock).mockReset().mockResolvedValue(localState);
  });

  it("loads the local checklist when there is no logged-in user", async () => {
    const { result } = await renderHook(() => useChecklistState(null));

    await waitFor(() => expect(result.current[0]).toEqual(localState));
    expect(getServerChecklist).not.toHaveBeenCalled();
  });

  it("migrates an old-shape server checklist instead of crashing on categories", async () => {
    // Pre-categories server shape: no `categories` field at all.
    const packingItems = [{ id: "p1", label: "Зарядка", checked: false }];
    const legacyChecklist = {
      tripName: "Osaka",
      tripStartDate: null,
      tripEndDate: null,
      packingItems
    } as unknown as PackingChecklist;
    (getServerChecklist as jest.Mock).mockResolvedValue({ checklist: legacyChecklist });

    const { result } = await renderHook(() => useChecklistState("user-1"));

    await waitFor(() => expect(result.current[0]).not.toBeNull());
    const categories = result.current[0]!.categories;
    expect(categories.find((c) => c.id === "packing")?.items).toEqual(packingItems);
    expect(categories.find((c) => c.id === "documents")).toBeDefined();
  });

  it("falls back to the local checklist when the server fetch fails", async () => {
    (getServerChecklist as jest.Mock).mockRejectedValue(new Error("network down"));

    const { result } = await renderHook(() => useChecklistState("user-1"));

    await waitFor(() => expect(result.current[0]).toEqual(localState));
  });
});
