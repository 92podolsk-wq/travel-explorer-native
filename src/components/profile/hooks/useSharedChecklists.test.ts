import { renderHook, waitFor } from "@testing-library/react-native";
import { useSharedChecklists } from "./useSharedChecklists";
import { getChecklistsSharedWithMe } from "@/shared/api/checklist";
import type { PackingChecklist } from "@/entities/checklist/model/types";
import type { FriendUser } from "@/entities/user/model/types";

jest.mock("@/shared/api/checklist", () => ({ getChecklistsSharedWithMe: jest.fn() }));

// migrateState pulls in packing-checklist.ts, which imports expo-notifications
// at module scope (used elsewhere in that file for reminder scheduling) —
// stub it so it doesn't warn about Expo Go push support in the test log.
jest.mock("expo-notifications", () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: "date" }
}));

function makeOwner(id: string): FriendUser {
  return { id, name: null, username: id, avatarId: null } as unknown as FriendUser;
}

describe("useSharedChecklists", () => {
  beforeEach(() => {
    (getChecklistsSharedWithMe as jest.Mock).mockReset();
  });

  it("returns null and fetches nothing without a logged-in user", async () => {
    const { result } = await renderHook(() => useSharedChecklists(null));
    expect(result.current).toBeNull();
    expect(getChecklistsSharedWithMe).not.toHaveBeenCalled();
  });

  it("normalizes a friend's old-shape checklist instead of leaving categories undefined", async () => {
    const documentItems = [{ id: "d1", label: "Паспорт", checked: true }];
    const legacyChecklist = {
      tripName: null,
      tripStartDate: null,
      tripEndDate: null,
      documentItems
    } as unknown as PackingChecklist;
    (getChecklistsSharedWithMe as jest.Mock).mockResolvedValue({
      checklists: [{ owner: makeOwner("friend-1"), checklist: legacyChecklist }]
    });

    const { result } = await renderHook(() => useSharedChecklists("me"));

    await waitFor(() => expect(result.current).not.toBeNull());
    const [entry] = result.current!;
    expect(entry.checklist.categories.find((c) => c.id === "documents")?.items).toEqual(documentItems);
    // categories.flatMap must not throw for any entry.
    expect(() => entry.checklist.categories.flatMap((c) => c.items)).not.toThrow();
  });

  it("passes through an already-current checklist unchanged", async () => {
    const checklist: PackingChecklist = {
      tripName: "Trip",
      tripStartDate: null,
      tripEndDate: null,
      categories: [{ id: "custom", title: "Extras", emoji: "✨", items: [] }]
    };
    (getChecklistsSharedWithMe as jest.Mock).mockResolvedValue({
      checklists: [{ owner: makeOwner("friend-1"), checklist }]
    });

    const { result } = await renderHook(() => useSharedChecklists("me"));

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current![0].checklist.categories).toEqual(checklist.categories);
  });
});
