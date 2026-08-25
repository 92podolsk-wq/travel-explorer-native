import { Alert } from "react-native";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useOfflineRegionActions } from "./useOfflineRegionActions";
import { useExplorerStore } from "@/shared/model/explorer-store";
import type { Region } from "@/entities/region/model/types";

jest.mock("@/shared/map/offline-maps", () => ({
  getDownloadedRegionIds: jest.fn(),
  downloadRegionOffline: jest.fn(),
  downloadRegionPhotos: jest.fn(),
  deleteRegionOffline: jest.fn(),
  deleteRegionPhotos: jest.fn()
}));

import {
  getDownloadedRegionIds,
  downloadRegionOffline,
  downloadRegionPhotos,
  deleteRegionOffline,
  deleteRegionPhotos
} from "@/shared/map/offline-maps";

const initialState = useExplorerStore.getState();

const testRegion = { id: "region-1", nameByLanguage: {}, name: "Region One" } as unknown as Region;

describe("useOfflineRegionActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useExplorerStore.setState(initialState, true);
    (getDownloadedRegionIds as jest.Mock).mockResolvedValue([]);
  });

  it("loads downloaded region ids on mount", async () => {
    (getDownloadedRegionIds as jest.Mock).mockResolvedValue(["region-1"]);

    const { result } = await renderHook(() => useOfflineRegionActions(testRegion));

    await waitFor(() => {
      expect(result.current.isRegionDownloaded).toBe(true);
    });
  });

  it("downloads the active region and marks it as downloaded", async () => {
    (downloadRegionOffline as jest.Mock).mockResolvedValue(undefined);
    (downloadRegionPhotos as jest.Mock).mockResolvedValue(undefined);

    const { result } = await renderHook(() => useOfflineRegionActions(testRegion));
    await waitFor(() => expect(getDownloadedRegionIds).toHaveBeenCalled());

    await result.current.handleDownloadActiveRegion();

    expect(downloadRegionOffline).toHaveBeenCalledWith(testRegion, expect.any(String), expect.any(Function));
    expect(useExplorerStore.getState().downloadedRegionIds).toEqual(["region-1"]);
  });

  it("does nothing when downloading with no active region", async () => {
    const { result } = await renderHook(() => useOfflineRegionActions(null));

    await result.current.handleDownloadActiveRegion();

    expect(downloadRegionOffline).not.toHaveBeenCalled();
  });

  it("clears progress and does not mark the region downloaded when the download fails", async () => {
    (downloadRegionOffline as jest.Mock).mockRejectedValue(new Error("network down"));

    const { result } = await renderHook(() => useOfflineRegionActions(testRegion));
    await waitFor(() => expect(getDownloadedRegionIds).toHaveBeenCalled());

    await result.current.handleDownloadActiveRegion();

    expect(useExplorerStore.getState().downloadedRegionIds).toEqual([]);
    expect(useExplorerStore.getState().downloadingProgress["region-1"]).toBeUndefined();
  });

  it("reflects in-progress download percentage", async () => {
    let resolvePhotos!: () => void;
    (downloadRegionOffline as jest.Mock).mockImplementation(async (_region, _styleUrl, onProgress) => {
      onProgress({ percentage: 50, state: "downloading" });
    });
    (downloadRegionPhotos as jest.Mock).mockImplementation(
      () => new Promise<void>((resolve) => (resolvePhotos = resolve))
    );

    const { result } = await renderHook(() => useOfflineRegionActions(testRegion));
    await waitFor(() => expect(getDownloadedRegionIds).toHaveBeenCalled());

    const downloadPromise = result.current.handleDownloadActiveRegion();

    await waitFor(() => {
      expect(useExplorerStore.getState().downloadingProgress["region-1"]).toBeCloseTo(35);
    });

    resolvePhotos();
    await downloadPromise;
  });

  it("deletes the active region after confirming the destructive alert action", async () => {
    useExplorerStore.setState({ downloadedRegionIds: ["region-1"] });
    (deleteRegionOffline as jest.Mock).mockResolvedValue(undefined);
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
      const destructiveButton = buttons?.find((button) => button.style === "destructive");
      destructiveButton?.onPress?.();
    });

    const { result } = await renderHook(() => useOfflineRegionActions(testRegion));
    await waitFor(() => expect(getDownloadedRegionIds).toHaveBeenCalled());

    result.current.handleDeleteActiveRegion();

    await waitFor(() => {
      expect(useExplorerStore.getState().downloadedRegionIds).toEqual([]);
    });
    expect(deleteRegionOffline).toHaveBeenCalledWith("region-1");
    expect(deleteRegionPhotos).toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
