import { renderHook, waitFor } from "@testing-library/react-native";
import { useFavoritesData } from "./useFavoritesData";
import { useExplorerStore } from "@/shared/model/explorer-store";

jest.mock("@/shared/api/itineraries", () => ({
  addItineraryStop: jest.fn(),
  removeItineraryStop: jest.fn()
}));
// The real module transitively imports @maplibre/maplibre-react-native
// (native-only, not transpilable under jest) via offline-maps.ts — stubbed
// with the same id-extraction logic since that's all this hook needs.
jest.mock("@/entities/itinerary/model/stop-point", () => ({
  stopPointId: (point: { kind: string; poi?: { id: string }; marker?: { id: string } }) =>
    point.kind === "poi" ? point.poi!.id : point.marker!.id
}));

import { addItineraryStop, removeItineraryStop } from "@/shared/api/itineraries";

const initialState = useExplorerStore.getState();

function makePoi(id: string, regionId: string, durationMinutes = 60) {
  return { id, regionId, durationMinutes } as never;
}

describe("useFavoritesData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useExplorerStore.setState(initialState, true);
  });

  it("groups favorites by region and computes per-region progress", async () => {
    useExplorerStore.setState({
      pois: [makePoi("p1", "r1"), makePoi("p2", "r1"), makePoi("p3", "r2"), makePoi("p4", "r2")],
      favorites: ["p1", "p3"],
      regions: [{ id: "r1", name: "R1", nameByLanguage: {} }, { id: "r2", name: "R2", nameByLanguage: {} }] as never
    });

    const { result } = await renderHook(() => useFavoritesData());

    expect(result.current.favoritesByRegion.map((g) => g.region.id)).toEqual(["r1", "r2"]);
    expect(result.current.favoritesRegionProgress).toEqual([
      { region: expect.objectContaining({ id: "r1" }), count: 1, percent: 50 },
      { region: expect.objectContaining({ id: "r2" }), count: 1, percent: 50 }
    ]);
  });

  it("estimates trip days from total duration, minimum 1 day when there are favorites", async () => {
    useExplorerStore.setState({
      pois: [makePoi("p1", "r1", 60)],
      favorites: ["p1"]
    });

    const { result } = await renderHook(() => useFavoritesData());
    expect(result.current.tripDays).toBe(1);
  });

  it("reports 0 trip days with no favorites", async () => {
    const { result } = await renderHook(() => useFavoritesData());
    expect(result.current.tripDays).toBe(0);
  });

  it("opens the auth modal instead of adding to itinerary for a guest", async () => {
    const openAuthModal = jest.fn();
    useExplorerStore.setState({ authStatus: "guest", openAuthModal });

    const { result } = await renderHook(() => useFavoritesData());
    await result.current.handleAddToItinerary("p1");

    expect(openAuthModal).toHaveBeenCalled();
    expect(addItineraryStop).not.toHaveBeenCalled();
  });

  it("adds a poi to the itinerary and updates the store", async () => {
    useExplorerStore.setState({
      authStatus: "authenticated",
      itinerary: { id: "itin-1", stops: [] } as never
    });
    (addItineraryStop as jest.Mock).mockResolvedValue({ id: "itin-1", stops: [{ id: "stop-1" }] });

    const { result } = await renderHook(() => useFavoritesData());
    await result.current.handleAddToItinerary("p1");

    expect(addItineraryStop).toHaveBeenCalledWith("itin-1", { poiId: "p1" });
    await waitFor(() => expect(useExplorerStore.getState().itinerary).toEqual({ id: "itin-1", stops: [{ id: "stop-1" }] }));
  });

  it("adds only the not-yet-itinerary favorites when adding all", async () => {
    useExplorerStore.setState({
      authStatus: "authenticated",
      pois: [makePoi("p1", "r1"), makePoi("p2", "r1")],
      favorites: ["p1", "p2"],
      itinerary: { id: "itin-1", stops: [{ id: "s1", point: { kind: "poi", poi: { id: "p1" } } }] } as never
    });
    (addItineraryStop as jest.Mock).mockResolvedValue({ id: "itin-1", stops: [] });

    const { result } = await renderHook(() => useFavoritesData());
    expect(result.current.hasFavoritesNotInItinerary).toBe(true);

    await result.current.handleAddAllToItinerary();

    expect(addItineraryStop).toHaveBeenCalledWith("itin-1", { poiIds: ["p2"] });
  });

  it("removes a poi from the itinerary by matching its stop", async () => {
    useExplorerStore.setState({
      itinerary: { id: "itin-1", stops: [{ id: "stop-1", point: { kind: "poi", poi: { id: "p1" } } }] } as never
    });
    (removeItineraryStop as jest.Mock).mockResolvedValue({ id: "itin-1", stops: [] });

    const { result } = await renderHook(() => useFavoritesData());
    await result.current.handleRemoveFromItinerary("p1");

    expect(removeItineraryStop).toHaveBeenCalledWith("itin-1", "stop-1");
  });
});
