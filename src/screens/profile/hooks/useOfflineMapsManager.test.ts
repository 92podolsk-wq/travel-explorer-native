import { Alert } from "react-native";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useOfflineMapsManager } from "./useOfflineMapsManager";
import { useExplorerStore } from "@/shared/model/explorer-store";

jest.mock("@/shared/map/offline-maps", () => ({
  deleteRegionOffline: jest.fn(),
  deleteRegionPhotos: jest.fn(),
  getOfflineStorageBytesByRegion: jest.fn(),
  resolveOfflinePhotoUri: (id: string, url: string) => `resolved:${id}:${url}`
}));

import {
  deleteRegionOffline,
  deleteRegionPhotos,
  getOfflineStorageBytesByRegion
} from "@/shared/map/offline-maps";

const initialState = useExplorerStore.getState();

describe("useOfflineMapsManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useExplorerStore.setState(initialState, true);
    (getOfflineStorageBytesByRegion as jest.Mock).mockResolvedValue({});
  });

  it("filters regions down to just the downloaded ones", async () => {
    useExplorerStore.setState({
      regions: [{ id: "r1" }, { id: "r2" }, { id: "r3" }] as never,
      downloadedRegionIds: ["r1", "r3"]
    });

    const { result } = await renderHook(() => useOfflineMapsManager());

    expect(result.current.downloadedRegions.map((r: { id: string }) => r.id)).toEqual(["r1", "r3"]);
  });

  it("sums the per-region byte counts into a total", async () => {
    useExplorerStore.setState({ regions: [{ id: "r1" }] as never, downloadedRegionIds: ["r1"] });
    (getOfflineStorageBytesByRegion as jest.Mock).mockResolvedValue({ r1: 1000, r2: 2000 });

    const { result } = await renderHook(() => useOfflineMapsManager());

    await waitFor(() => expect(result.current.totalOfflineBytes).toBe(3000));
  });

  it("returns the highest-importance photo as the region thumbnail", async () => {
    useExplorerStore.setState({
      pois: [
        { regionId: "r1", importance: 1, photos: [{ id: "low", url: "low.jpg" }] },
        { regionId: "r1", importance: 5, photos: [{ id: "high", url: "high.jpg" }] },
        { regionId: "r2", importance: 9, photos: [{ id: "other", url: "other.jpg" }] }
      ] as never
    });

    const { result } = await renderHook(() => useOfflineMapsManager());

    expect(result.current.regionThumbnail("r1")).toBe("resolved:high:high.jpg");
  });

  it("returns null for a region with no photographed pois", async () => {
    useExplorerStore.setState({ pois: [] });
    const { result } = await renderHook(() => useOfflineMapsManager());
    expect(result.current.regionThumbnail("r1")).toBeNull();
  });

  it("deletes region offline data and photos after confirming, and drops it from downloadedRegionIds", async () => {
    useExplorerStore.setState({
      downloadedRegionIds: ["r1", "r2"],
      pois: [{ regionId: "r1", photos: [] }] as never
    });
    (deleteRegionOffline as jest.Mock).mockResolvedValue(undefined);

    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((...args) => {
      const buttons = args[2] as { style?: string; onPress?: () => void }[] | undefined;
      buttons?.find((b) => b.style === "destructive")?.onPress?.();
    });

    const { result } = await renderHook(() => useOfflineMapsManager());
    result.current.handleRegionMenu("r1", "Region One");

    await waitFor(() => expect(useExplorerStore.getState().downloadedRegionIds).toEqual(["r2"]));
    expect(deleteRegionOffline).toHaveBeenCalledWith("r1");
    expect(deleteRegionPhotos).toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
