import { Alert } from "react-native";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useCustomMarkers } from "./useCustomMarkers";
import { useExplorerStore } from "@/shared/model/explorer-store";

jest.mock("@/shared/api/custom-markers", () => ({
  listCustomMarkers: jest.fn(),
  createCustomMarker: jest.fn(),
  deleteCustomMarker: jest.fn()
}));
jest.mock("@/shared/api/itineraries", () => ({
  addItineraryStop: jest.fn(),
  removeItineraryStop: jest.fn()
}));

import { createCustomMarker, deleteCustomMarker, listCustomMarkers } from "@/shared/api/custom-markers";
import { addItineraryStop, removeItineraryStop } from "@/shared/api/itineraries";

const initialState = useExplorerStore.getState();

describe("useCustomMarkers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useExplorerStore.setState(initialState, true);
    (listCustomMarkers as jest.Mock).mockResolvedValue({ markers: [], limit: 5 });
  });

  it("does not fetch custom markers for a guest", async () => {
    useExplorerStore.setState({ authStatus: "guest" });
    await renderHook(() => useCustomMarkers());

    expect(listCustomMarkers).not.toHaveBeenCalled();
  });

  it("loads custom markers for an authenticated user on mount", async () => {
    useExplorerStore.setState({ authStatus: "authenticated" });
    (listCustomMarkers as jest.Mock).mockResolvedValue({ markers: [{ id: "m1" }], limit: 5 });

    await renderHook(() => useCustomMarkers());

    await waitFor(() => {
      expect(useExplorerStore.getState().customMarkers).toEqual([{ id: "m1" }]);
    });
    expect(useExplorerStore.getState().customMarkerLimit).toBe(5);
  });

  it("opens the auth modal on long-press for a guest instead of placing a marker", async () => {
    useExplorerStore.setState({ authStatus: "guest" });
    const openAuthModal = jest.fn();
    useExplorerStore.setState({ openAuthModal });

    const { result } = await renderHook(() => useCustomMarkers());
    result.current.handleMapLongPress(35, 135);

    expect(openAuthModal).toHaveBeenCalled();
    expect(result.current.pendingMarkerCoords).toBeNull();
  });

  it("sets pending marker coords on long-press for an authenticated user", async () => {
    useExplorerStore.setState({ authStatus: "authenticated" });

    const { result } = await renderHook(() => useCustomMarkers());
    result.current.handleMapLongPress(35, 135);

    await waitFor(() => {
      expect(result.current.pendingMarkerCoords).toEqual({ lat: 35, lng: 135 });
    });
  });

  it("saves a marker and clears pending coords on success", async () => {
    useExplorerStore.setState({ authStatus: "authenticated" });
    (createCustomMarker as jest.Mock).mockResolvedValue({ id: "new-marker", lat: 35, lng: 135, color: "#000", label: "Spot" });

    const { result } = await renderHook(() => useCustomMarkers());
    result.current.handleMapLongPress(35, 135);
    await waitFor(() => expect(result.current.pendingMarkerCoords).not.toBeNull());

    const outcome = await result.current.handleSaveMarker("#000", "Spot");

    expect(outcome).toEqual({ ok: true });
    expect(useExplorerStore.getState().customMarkers).toEqual([
      { id: "new-marker", lat: 35, lng: 135, color: "#000", label: "Spot" }
    ]);
  });

  it("returns an error result when saving a marker fails", async () => {
    useExplorerStore.setState({ authStatus: "authenticated" });
    (createCustomMarker as jest.Mock).mockRejectedValue(new Error("network down"));

    const { result } = await renderHook(() => useCustomMarkers());
    result.current.handleMapLongPress(35, 135);
    await waitFor(() => expect(result.current.pendingMarkerCoords).not.toBeNull());

    const outcome = await result.current.handleSaveMarker("#000", "Spot");

    expect(outcome.ok).toBe(false);
  });

  it("deletes a marker after confirming the destructive alert action", async () => {
    // Seeded via the mocked listCustomMarkers response (not a direct
    // setState) since the hook's mount effect would otherwise overwrite a
    // manually-seeded customMarkers array once it resolves.
    useExplorerStore.setState({ authStatus: "authenticated" });
    (listCustomMarkers as jest.Mock).mockResolvedValue({
      markers: [{ id: "m1", lat: 35, lng: 135, color: "#000", label: "Spot" }],
      limit: 5
    });
    (deleteCustomMarker as jest.Mock).mockResolvedValue({ ok: true });

    // Each Alert.alert call in this flow (outer options list, then the nested
    // confirm) has its "proceed with delete" button styled "destructive" —
    // always picking that one drives the flow through both dialogs.
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((...args) => {
      const buttons = args[2] as { style?: string; onPress?: () => void }[] | undefined;
      const destructive = buttons?.find((button) => button.style === "destructive");
      destructive?.onPress?.();
    });

    const { result } = await renderHook(() => useCustomMarkers());
    await waitFor(() => expect(useExplorerStore.getState().customMarkers).toHaveLength(1));
    await result.current.handleMarkerPress("m1");

    await waitFor(() => {
      expect(useExplorerStore.getState().customMarkers).toEqual([]);
    });
    await waitFor(() => {
      expect(deleteCustomMarker).toHaveBeenCalledWith("m1");
    });

    alertSpy.mockRestore();
  });

  it("adds the marker to the active itinerary when chosen from the alert", async () => {
    useExplorerStore.setState({ authStatus: "authenticated", itinerary: { id: "itin-1", stops: [] } as never });
    (listCustomMarkers as jest.Mock).mockResolvedValue({
      markers: [{ id: "m1", lat: 35, lng: 135, color: "#000", label: "Spot" }],
      limit: 5
    });
    (addItineraryStop as jest.Mock).mockResolvedValue({ id: "itin-1", stops: [{ id: "stop-1" }] });

    // The first button is the "add to itinerary" option (no style) — the
    // marker isn't in the itinerary yet, so this is the one to press here.
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((...args) => {
      const buttons = args[2] as { style?: string; onPress?: () => void }[] | undefined;
      const addOption = buttons?.find((button) => button.style === undefined);
      addOption?.onPress?.();
    });

    const { result } = await renderHook(() => useCustomMarkers());
    await waitFor(() => expect(useExplorerStore.getState().customMarkers).toHaveLength(1));
    await result.current.handleMarkerPress("m1");

    await waitFor(() => {
      expect(useExplorerStore.getState().itinerary).toEqual({ id: "itin-1", stops: [{ id: "stop-1" }] });
    });
    await waitFor(() => {
      expect(addItineraryStop).toHaveBeenCalledWith("itin-1", { customMarkerId: "m1" });
    });

    alertSpy.mockRestore();
  });
});
