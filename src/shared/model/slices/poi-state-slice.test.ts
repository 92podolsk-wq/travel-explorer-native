import { create } from "zustand";
import { createExplorerState } from "../create-explorer-state";
import type { ExplorerState } from "../types";

jest.mock("@/shared/api/poi-actions", () => ({
  toggleFavoriteApi: jest.fn(),
  toggleVisitedApi: jest.fn(),
  markViewedApi: jest.fn(),
  clearFavoritesApi: jest.fn(),
  clearVisitedApi: jest.fn(),
  clearViewedApi: jest.fn()
}));

import { toggleFavoriteApi, toggleVisitedApi, markViewedApi } from "@/shared/api/poi-actions";

function createTestStore() {
  return create<ExplorerState>()(createExplorerState);
}

// Lets a microtask (the .catch() attached inside toggleFavorite/etc.) run
// before we assert on state that only changes once the rejected promise
// has been handled.
function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("poi-state-slice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("toggleFavorite optimistically flips favorites before the API call settles", () => {
    (toggleFavoriteApi as jest.Mock).mockReturnValue(new Promise(() => {}));
    const store = createTestStore();

    store.getState().toggleFavorite("poi-1");

    expect(store.getState().favorites).toEqual(["poi-1"]);
    expect(store.getState().pendingPoiActions).toEqual([]);
  });

  it("queues a pendingPoiAction when the toggleFavorite API call fails", async () => {
    (toggleFavoriteApi as jest.Mock).mockRejectedValue(new Error("network down"));
    const store = createTestStore();

    store.getState().toggleFavorite("poi-1");
    await flushMicrotasks();

    expect(store.getState().favorites).toEqual(["poi-1"]);
    expect(store.getState().pendingPoiActions).toEqual([{ poiId: "poi-1", kind: "toggleFavorite" }]);
  });

  it("queues a pendingPoiAction when toggleVisited or markPoiViewed fail", async () => {
    (toggleVisitedApi as jest.Mock).mockRejectedValue(new Error("network down"));
    (markViewedApi as jest.Mock).mockRejectedValue(new Error("network down"));
    const store = createTestStore();

    store.getState().toggleVisited("poi-2");
    store.getState().markPoiViewed("poi-3");
    await flushMicrotasks();

    expect(store.getState().pendingPoiActions).toEqual(
      expect.arrayContaining([
        { poiId: "poi-2", kind: "toggleVisited" },
        { poiId: "poi-3", kind: "markViewed" }
      ])
    );
  });

  it("flushPendingPoiActions replays the queue in order and drops entries that now succeed", async () => {
    (toggleFavoriteApi as jest.Mock).mockResolvedValue(undefined);
    (toggleVisitedApi as jest.Mock).mockResolvedValue(undefined);
    const store = createTestStore();

    store.setState({
      pendingPoiActions: [
        { poiId: "poi-1", kind: "toggleFavorite" },
        { poiId: "poi-2", kind: "toggleVisited" }
      ]
    });

    await store.getState().flushPendingPoiActions();

    expect(toggleFavoriteApi).toHaveBeenCalledWith("poi-1");
    expect(toggleVisitedApi).toHaveBeenCalledWith("poi-2");
    expect(store.getState().pendingPoiActions).toEqual([]);
  });

  it("flushPendingPoiActions stops at the first failure and keeps it (plus untried entries) queued", async () => {
    (toggleFavoriteApi as jest.Mock).mockRejectedValue(new Error("still offline"));
    (toggleVisitedApi as jest.Mock).mockResolvedValue(undefined);
    const store = createTestStore();

    store.setState({
      pendingPoiActions: [
        { poiId: "poi-1", kind: "toggleFavorite" },
        { poiId: "poi-2", kind: "toggleVisited" }
      ]
    });

    await store.getState().flushPendingPoiActions();

    expect(toggleFavoriteApi).toHaveBeenCalledWith("poi-1");
    expect(toggleVisitedApi).not.toHaveBeenCalled();
    expect(store.getState().pendingPoiActions).toEqual([
      { poiId: "poi-1", kind: "toggleFavorite" },
      { poiId: "poi-2", kind: "toggleVisited" }
    ]);
  });
});
