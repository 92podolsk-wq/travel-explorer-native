import { renderHook, waitFor } from "@testing-library/react-native";
import { useAppBootstrap } from "./useAppBootstrap";
import { useExplorerStore } from "@/shared/model/explorer-store";
import type { ExplorerState } from "@/shared/model/types";
import type { Region } from "@/entities/region/model/types";
import type { SiteSettings } from "@/entities/site-setting/model/types";

jest.mock("@/shared/api/auth", () => ({ getMe: jest.fn() }));
jest.mock("@/shared/api/bootstrap", () => ({ getBootstrap: jest.fn() }));

import { getMe } from "@/shared/api/auth";
import { getBootstrap } from "@/shared/api/bootstrap";

const initialState = useExplorerStore.getState();

const testRegions = [{ id: "region-1" }] as unknown as Region[];

const bootstrapPayload: Parameters<ExplorerState["setBootstrapData"]>[0] = {
  pois: [],
  regions: testRegions,
  countries: [],
  areas: [],
  explorationModes: [],
  categories: [],
  siteSettings: { mapStyleId: "openfreemap-bright" } as unknown as SiteSettings
};

describe("useAppBootstrap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useExplorerStore.setState(initialState, true);
  });

  it("loads bootstrap data and clears bootError/isOffline on success", async () => {
    (getMe as jest.Mock).mockResolvedValue({ user: null });
    (getBootstrap as jest.Mock).mockResolvedValue(bootstrapPayload);

    const { result } = await renderHook(() => useAppBootstrap());

    await waitFor(() => {
      expect(useExplorerStore.getState().regions).toEqual(bootstrapPayload.regions);
    });

    expect(result.current.bootError).toBe(false);
    expect(useExplorerStore.getState().isOffline).toBe(false);
    expect(useExplorerStore.getState().authStatus).toBe("guest");
  });

  it("falls back to offline mode when the fetch fails but cached reference data exists", async () => {
    useExplorerStore.setState({ regions: bootstrapPayload.regions, hasHydrated: true });
    (getMe as jest.Mock).mockRejectedValue(new Error("network down"));
    (getBootstrap as jest.Mock).mockRejectedValue(new Error("network down"));

    const { result } = await renderHook(() => useAppBootstrap());

    await waitFor(() => {
      expect(useExplorerStore.getState().isOffline).toBe(true);
    });

    expect(result.current.bootError).toBe(false);
    expect(useExplorerStore.getState().authStatus).toBe("guest");
  });

  it("shows the boot error screen when the fetch fails with nothing cached to fall back to", async () => {
    useExplorerStore.setState({ regions: [], hasHydrated: true });
    (getMe as jest.Mock).mockRejectedValue(new Error("network down"));
    (getBootstrap as jest.Mock).mockRejectedValue(new Error("network down"));

    const { result } = await renderHook(() => useAppBootstrap());

    await waitFor(() => {
      expect(result.current.bootError).toBe(true);
    });
  });

  it("handleRetry re-runs the bootstrap load and can recover from bootError", async () => {
    useExplorerStore.setState({ regions: [], hasHydrated: true });
    (getMe as jest.Mock).mockRejectedValue(new Error("network down"));
    (getBootstrap as jest.Mock).mockRejectedValue(new Error("network down"));

    const { result } = await renderHook(() => useAppBootstrap());
    await waitFor(() => expect(result.current.bootError).toBe(true));

    (getMe as jest.Mock).mockResolvedValue({ user: null });
    (getBootstrap as jest.Mock).mockResolvedValue(bootstrapPayload);

    result.current.handleRetry();
    await waitFor(() => expect(result.current.bootError).toBe(false));
    expect(useExplorerStore.getState().regions).toEqual(bootstrapPayload.regions);
  });
});
