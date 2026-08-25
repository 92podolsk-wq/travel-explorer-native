import { renderHook, waitFor } from "@testing-library/react-native";
import { usePoiSheetNavigation } from "./usePoiSheetNavigation";
import { useExplorerStore } from "@/shared/model/explorer-store";
import type { Poi } from "@/entities/poi/model/types";

const initialState = useExplorerStore.getState();

function makePoi(id: string, regionId: string, lat: number, lng: number): Poi {
  return { id, regionId, coordinates: { lat, lng } } as unknown as Poi;
}

describe("usePoiSheetNavigation", () => {
  beforeEach(() => {
    useExplorerStore.setState(initialState, true);
  });

  it("suggests the nearest unvisited poi in the same region as next", async () => {
    const current = makePoi("p1", "region-1", 0, 0);
    useExplorerStore.setState({
      pois: [current, makePoi("p2", "region-1", 0, 1), makePoi("p3", "region-1", 0, 0.1), makePoi("p4", "region-2", 0, 0.05)]
    });

    const { result } = await renderHook(() => usePoiSheetNavigation(current));

    expect(result.current.nextPreviewPoi?.id).toBe("p3");
    expect(result.current.hasNextPlace).toBe(true);
    expect(result.current.hasPreviousPlace).toBe(false);
  });

  it("goForward advances selection and excludes the visited poi from future next-suggestions", async () => {
    const p1 = makePoi("p1", "region-1", 0, 0);
    const p3 = makePoi("p3", "region-1", 0, 0.1);
    const setSelectedPoiId = jest.fn();
    useExplorerStore.setState({
      pois: [p1, makePoi("p2", "region-1", 0, 1), p3],
      setSelectedPoiId
    });

    const { result, rerender } = await renderHook((props: { poi: Poi }) => usePoiSheetNavigation(props.poi), { initialProps: { poi: p1 } });

    result.current.goForward();
    expect(setSelectedPoiId).toHaveBeenCalledWith("p3");
    expect(result.current.isInternalNavRef.current).toBe(true);

    await rerender({ poi: p3 });
    await waitFor(() => expect(result.current.hasPreviousPlace).toBe(true));
    expect(result.current.previousPreviewPoi?.id).toBe("p1");
  });

  it("goBack retraces the visited path instead of picking the nearest poi", async () => {
    const p1 = makePoi("p1", "region-1", 0, 0);
    const p3 = makePoi("p3", "region-1", 0, 0.1);
    const setSelectedPoiId = jest.fn();
    useExplorerStore.setState({ pois: [p1, p3], setSelectedPoiId });

    const { result, rerender } = await renderHook((props: { poi: Poi }) => usePoiSheetNavigation(props.poi), { initialProps: { poi: p1 } });
    result.current.goForward();
    await rerender({ poi: p3 });
    await waitFor(() => expect(result.current.hasPreviousPlace).toBe(true));

    result.current.goBack();
    expect(setSelectedPoiId).toHaveBeenCalledWith("p1");
  });

  it("resetHistory clears the visited chain so the same poi can be suggested again", async () => {
    const p1 = makePoi("p1", "region-1", 0, 0);
    const p3 = makePoi("p3", "region-1", 0, 0.1);
    useExplorerStore.setState({ pois: [p1, p3] });

    const { result } = await renderHook(() => usePoiSheetNavigation(p1));
    result.current.goForward();
    result.current.resetHistory("p1");

    await waitFor(() => expect(result.current.nextPreviewPoi?.id).toBe("p3"));
  });
});
